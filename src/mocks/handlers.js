// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';
import { db, nextTradeId, nextSubentryId, DB_VERSION } from './db';

// Small helper to read body regardless of JSON/FormData
async function readBody(request) {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) return request.json();
  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    const out = {};
    for (const [k, v] of fd.entries()) out[k] = v;
    return out;
  }
  try { return await request.json(); } catch { return {}; }
}

export const handlers = [
  // Debug ping so you can verify MSW is active
  http.get('/__debug/db', () =>
    HttpResponse.json({
      DB_VERSION,
      trades: db.trades.length,
      subentries: db.subentries.length,
      sample: db.trades.slice(0, 3),
    })
  ),

  // Trades
  http.get('/trades', () => HttpResponse.json(db.trades)),
  http.post('/trades', async ({ request }) => {
    const body = await readBody(request);
    const newTrade = { id: nextTradeId(), remarks: '', ...body };
    db.trades.unshift(newTrade);
    return HttpResponse.json(newTrade, { status: 201 });
  }),
  http.put('/trades/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const i = db.trades.findIndex(t => t.id === id);
    if (i < 0) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const patch = await readBody(request);
    db.trades[i] = { ...db.trades[i], ...patch };
    return HttpResponse.json(db.trades[i]);
  }),
  http.put('/trades/:id/remarks', async ({ params, request }) => {
    const id = Number(params.id);
    const i = db.trades.findIndex(t => t.id === id);
    if (i < 0) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const { remarks = '' } = await readBody(request);
    db.trades[i].remarks = remarks;
    return HttpResponse.json(db.trades[i]);
  }),
  http.delete('/trades/:id', ({ params }) => {
    const id = Number(params.id);
    const t = db.trades.find(x => x.id === id);
    if (!t) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    db.trades = db.trades.filter(x => x.id !== id);
    db.subentries = db.subentries.filter(s => s.trade_id !== id);
    return HttpResponse.json(t);
  }),

  // Subentries
  http.get('/trades/:id/subentries', ({ params }) => {
    const tradeId = Number(params.id);
    return HttpResponse.json(db.subentries.filter(s => s.trade_id === tradeId));
  }),
  http.post('/trades/:id/subentries', async ({ params, request }) => {
    const tradeId = Number(params.id);
    const body = await readBody(request);
    const newSub = { id: nextSubentryId(), trade_id: tradeId, ...body };
    db.subentries.push(newSub);
    return HttpResponse.json(newSub, { status: 201 });
  }),
  http.put('/trades/subentries/:id/exit', async ({ params, request }) => {
    const id = Number(params.id);
    const i = db.subentries.findIndex(s => s.id === id);
    if (i < 0) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const patch = await readBody(request);
    db.subentries[i] = { ...db.subentries[i], ...patch };
    return HttpResponse.json(db.subentries[i]);
  }),
  http.put('/subentries/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const i = db.subentries.findIndex(s => s.id === id);
    if (i < 0) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    const patch = await readBody(request);
    db.subentries[i] = { ...db.subentries[i], ...patch };
    return HttpResponse.json(db.subentries[i]);
  }),
  http.delete('/subentries/:id', ({ params }) => {
    const id = Number(params.id);
    const before = db.subentries.length;
    db.subentries = db.subentries.filter(s => s.id !== id);
    return before === db.subentries.length
      ? HttpResponse.json({ error: 'Not found' }, { status: 404 })
      : HttpResponse.json({ ok: true });
  }),

  // Pretend uploads exist
  http.get('/trades/uploads/:file', () => new HttpResponse(null, { status: 204 })),
];
