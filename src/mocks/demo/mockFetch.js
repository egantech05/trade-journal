
let tradeId = 1000;
let subentryId = 5000;

const db = { trades: [], subentries: [] };


const choice = (arr) => arr[(Math.random() * arr.length) | 0];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (min, max) => min + Math.random() * (max - min);
const iso = (d) => new Date(d).toISOString();


function normalizeTrade(t) {
  const m = { position: 'Buy', symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', remarks: '', ...t };

  m.entryTime  = m.entryTime  ?? m.entry_time;
  m.entry_time = m.entry_time ?? m.entryTime;

  m.entryPrice  = m.entryPrice  ?? m.entry_price;
  m.entry_price = m.entry_price ?? m.entryPrice;

  m.entrySize  = m.entrySize  ?? m.entry_size;
  m.entry_size = m.entry_size ?? m.entrySize;

  m.exitTime  = m.exitTime  ?? m.exit_time ?? null;
  m.exit_time = m.exit_time ?? m.exitTime ?? null;

  m.exitPrice  = m.exitPrice  ?? m.exit_price ?? null;
  m.exit_price = m.exit_price ?? m.exitPrice ?? null;

  m.exitSize  = m.exitSize  ?? m.exit_size ?? null;
  m.exit_size = m.exit_size ?? m.exitSize ?? null;

  const entrySnap = m.entrySnapshot ?? m.snapshots?.entry ?? m.entry_snapshot ?? null;
  const exitSnap  = m.exitSnapshot  ?? m.snapshots?.exit  ?? m.exit_snapshot  ?? null;
  m.entrySnapshot = entrySnap;
  m.exitSnapshot  = exitSnap;
  m.entry_snapshot = entrySnap;
  m.exit_snapshot  = exitSnap;
  m.snapshots = { entry: entrySnap, exit: exitSnap };

  m.instrument = m.instrument ?? m.symbol;
  m.playbook = m.playbook ?? m.strategy;

  return m;
}

function normalizeSub(s) {
  const m = { position: 'Buy', ...s };

  m.entryTime  = m.entryTime  ?? m.entry_time;
  m.entry_time = m.entry_time ?? m.entryTime;

  m.entryPrice  = m.entryPrice  ?? m.entry_price;
  m.entry_price = m.entry_price ?? m.entryPrice;

  m.entrySize  = m.entrySize  ?? m.entry_size;
  m.entry_size = m.entry_size ?? m.entrySize;

  m.exitTime  = m.exitTime  ?? m.exit_time ?? null;
  m.exit_time = m.exit_time ?? m.exitTime ?? null;

  m.exitPrice  = m.exitPrice  ?? m.exit_price ?? null;
  m.exit_price = m.exit_price ?? m.exitPrice ?? null;

  m.exitSize  = m.exitSize  ?? m.exit_size ?? null;
  m.exit_size = m.exit_size ?? m.exitSize ?? null;

  return m;
}


async function readBody(init) {
  const b = init?.body;
  if (!b) return {};
  if (typeof FormData !== 'undefined' && b instanceof FormData) {
    const o = {};
    for (const [k, v] of b.entries()) o[k] = v;
    return o;
  }
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch { return {}; }
  }

  return typeof b === 'object' ? b : {};
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function makeTrade({ when, pos, entryPrice, entrySize }) {
  return normalizeTrade({
    id: tradeId++,
    symbol: 'XAUUSD.s',
    strategy: 'M1-MACD-RSI',
    position: pos,
    remarks: '',
    entry_time: iso(when),
    entry_price: String(entryPrice),
    entry_size: String(entrySize),
    exit_time: null,
    exit_price: null,
    exit_size: null,
    snapshots: { entry: null, exit: null },
  });
}

function makeSubentry(tradeIdNum, { entryTime, entryPrice, size, pos, exitTime, exitPrice, exitSize }) {
  return normalizeSub({
    id: subentryId++,
    trade_id: tradeIdNum,
    position: pos,
    remarks: '',
    entry_time: iso(entryTime),
    entry_price: String(entryPrice),
    entry_size: String(size),
    exit_time: exitTime ? iso(exitTime) : null,
    exit_price: exitPrice != null ? String(exitPrice) : null,
    exit_size: exitSize != null ? String(exitSize) : null,
    entry_snapshot: null,
    exit_snapshot: null,
  });
}

function wiggle(base = 2450, amp = 40) {
  return +(base + rand(-amp, amp)).toFixed(1);
}

function makeSession(dayStart, { winBias = 0.58, openProb = 0.18 } = {}) {
  const pos = choice(['Buy', 'Sell']);
  const base = wiggle();
  const entryTime = new Date(dayStart.getTime() + rand(9 * 60, 12 * 60) * 60 * 1000);
  const trade = makeTrade({
    when: entryTime,
    pos,
    entryPrice: base,
    entrySize: choice([0.2, 0.3, 0.5, 1.0, 2.0]),
  });
  db.trades.push(trade);

  const legs = clamp(Math.round(rand(1, 4)), 1, 4);
  let last = entryTime;
  for (let i = 0; i < legs; i++) {
    const eTime = new Date(last.getTime() + rand(5, 45) * 60 * 1000);
    const shouldLeaveOpen = Math.random() < openProb && i === legs - 1;
    const xTime = shouldLeaveOpen ? null : new Date(eTime.getTime() + rand(10, 180) * 60 * 1000);

    const favorable = Math.random() < winBias;
    const drift = rand(2, 25);
    let xPx = null;
    if (xTime) {
      if (pos === 'Buy') xPx = +(base + (favorable ? drift : -drift)).toFixed(1);
      else xPx = +(base - (favorable ? drift : -drift)).toFixed(1);
    }

    db.subentries.push(
      makeSubentry(trade.id, {
        entryTime: eTime,
        entryPrice: +(base + rand(-3, 3)).toFixed(1),
        size: choice([0.1, 0.2, 0.3, 0.5, 1]),
        pos,
        exitTime: xTime,
        exitPrice: xPx,
        exitSize: xTime ? choice([0.1, 0.2, 0.3, 0.5, 1]) : null,
      })
    );

    last = xTime ?? eTime;
  }
}

export function seedDemo({ sessions = 100, daysBack = 60, weekendRatio = 0.15 } = {}) {
  db.trades.length = 0;
  db.subentries.length = 0;
  tradeId = 1000;
  subentryId = 5000;

  const today = new Date();
  let created = 0;
  for (let d = daysBack; d >= 0 && created < sessions; d--) {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - d);

    const dow = day.getDay();
    const isWeekend = dow === 0 || dow === 6;
    if (isWeekend && Math.random() > weekendRatio) continue;

    const perDay = clamp(Math.round(rand(1, 3)), 1, 3);
    for (let i = 0; i < perDay && created < sessions; i++) {
      makeSession(day, { winBias: 0.57, openProb: 0.2 });
      created++;
    }
  }

  if (!db.trades.length) {
    for (let i = 0; i < 3; i++) makeSession(new Date());
  }
}

export function resetDemo() { seedDemo(); }


export function installFetchMock() {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || 'GET').toUpperCase();

    if (!url.startsWith('/')) return realFetch(input, init);


    if (url === '/__debug/db' && method === 'GET') {
      return json({
        DB_VERSION: 'mockFetch:v2',
        trades: db.trades.length,
        subentries: db.subentries.length,
        sample: db.trades.slice(0, 3),
      });
    }


    if (url === '/trades' && method === 'GET') {
      return json(db.trades.map(normalizeTrade));
    }
    if (url === '/trades' && method === 'POST') {
      const body = await readBody(init);
      const t = normalizeTrade({
        id: tradeId++,
        entry_time: body.entry_time ?? body.entryTime,
        entry_price: body.entry_price ?? body.entryPrice,
        entry_size: body.entry_size ?? body.entrySize,
        exit_time: body.exit_time ?? body.exitTime ?? null,
        exit_price: body.exit_price ?? body.exitPrice ?? null,
        exit_size: body.exit_size ?? body.exitSize ?? null,
        position: body.position ?? body.side ?? 'Buy',
        remarks: body.remarks ?? '',
        symbol: body.symbol ?? 'XAUUSD.s',
        strategy: body.strategy ?? 'M1-MACD-RSI',
        snapshots: {
          entry: body.snapshots?.entry ?? body.entrySnapshot ?? null,
          exit: body.snapshots?.exit ?? body.exitSnapshot ?? null,
        },
      });
      db.trades.unshift(t);
      return json(t, 201);
    }


    const tradeMatch = url.match(/^\/trades\/(\d+)$/);
    if (tradeMatch) {
      const id = Number(tradeMatch[1]);
      if (method === 'PUT') {
        const body = await readBody(init);
        const i = db.trades.findIndex(t => t.id === id);
        if (i < 0) return json({ error: 'Not found' }, 404);
        db.trades[i] = normalizeTrade({ ...db.trades[i], ...body });
        return json(db.trades[i]);
      }
      if (method === 'DELETE') {
        db.subentries = db.subentries.filter(s => s.trade_id !== id);
        const before = db.trades.length;
        db.trades = db.trades.filter(t => t.id !== id);
        return json({ ok: before !== db.trades.length });
      }
    }

    
    const subsMatch = url.match(/^\/trades\/(\d+)\/subentries$/);
    if (subsMatch) {
      const tid = Number(subsMatch[1]);
      if (method === 'GET') {
        return json(db.subentries.filter(s => s.trade_id === tid).map(normalizeSub));
      }
      if (method === 'POST') {
        const body = await readBody(init); 
        const sub = normalizeSub({
          id: subentryId++,
          trade_id: tid,
          entry_time: body.entry_time ?? body.entryTime,
          entry_price: body.entry_price ?? body.entryPrice,
          entry_size: body.entry_size ?? body.entrySize,
          exit_time: body.exit_time ?? body.exitTime ?? null,
          exit_price: body.exit_price ?? body.exitPrice ?? null,
          exit_size: body.exit_size ?? body.exitSize ?? null,
          position: body.position ?? body.side ?? 'Buy',
          remarks: body.remarks ?? '',
          entry_snapshot: body.entry_snapshot ?? body.entrySnapshot ?? null,
          exit_snapshot: body.exit_snapshot ?? body.exitSnapshot ?? null,
        });
        db.subentries.push(sub);
        return json(sub, 201);
      }
    }

   
    const subExit = url.match(/^\/trades\/subentries\/(\d+)\/exit$/);
    if (subExit && method === 'PUT') {
      const id = Number(subExit[1]);
      const body = await readBody(init); // FormData supported
      const i = db.subentries.findIndex(s => s.id === id);
      if (i < 0) return json({ error: 'Not found' }, 404);
      db.subentries[i] = normalizeSub({ ...db.subentries[i], ...body });
      return json(db.subentries[i]);
    }

   
    const subMatch = url.match(/^\/subentries\/(\d+)$/);
    if (subMatch) {
      const id = Number(subMatch[1]);
      if (method === 'PUT') {
        const body = await readBody(init);
        const i = db.subentries.findIndex(s => s.id === id);
        if (i < 0) return json({ error: 'Not found' }, 404);
        db.subentries[i] = normalizeSub({ ...db.subentries[i], ...body });
        return json(db.subentries[i]);
      }
      if (method === 'DELETE') {
        const before = db.subentries.length;
        db.subentries = db.subentries.filter(s => s.id !== id);
        return json({ ok: before !== db.subentries.length });
      }
    }

   
    if (/^\/trades\/uploads\//.test(url) && method === 'GET') {
      return new Response(null, { status: 204 });
    }

 
    return realFetch(input, init);
  };

  return () => { window.fetch = realFetch; };
}
