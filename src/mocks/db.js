// src/mocks/db.js
export const DB_VERSION = 'static-rel-today';

if (typeof window !== 'undefined') {
  console.log('[MSW] db loaded:', DB_VERSION);
}

// ---------- time helpers ----------
function isoDaysAgo(daysAgo, h, m) {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(m);
  d.setHours(h);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}
const S = (n, dp = 2) => (n == null ? null : n.toFixed(dp));

// ---------- trades ----------
export const db = {
  trades: [
    // day 0 = today
    { id: 1,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: 'Today session – runner open',
      entryTime: isoDaysAgo(0, 10, 15), entryPrice: S(2453.2, 1), entrySize: S(0.50),
      exitTime: null, exitPrice: null, exitSize: null, entry_snapshot: null, exit_snapshot: null },

    { id: 2,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Sell', remarks: 'News fade',
      entryTime: isoDaysAgo(1, 9, 5),  entryPrice: S(2464.7, 1), entrySize: S(1.00),
      exitTime: isoDaysAgo(1, 11, 25), exitPrice: S(2458.8, 1), exitSize: S(1.00), entry_snapshot: null, exit_snapshot: null }, // win

    { id: 3,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: 'Late entry – loss',
      entryTime: isoDaysAgo(2, 9, 20), entryPrice: S(2451.6, 1), entrySize: S(0.30),
      exitTime: isoDaysAgo(2, 10, 55), exitPrice: S(2448.9, 1), exitSize: S(0.30), entry_snapshot: null, exit_snapshot: null }, // loss

    { id: 4,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Sell', remarks: '',
      entryTime: isoDaysAgo(3, 10, 40), entryPrice: S(2466.1, 1), entrySize: S(0.50),
      exitTime: isoDaysAgo(3, 13, 5),  exitPrice: S(2459.9, 1), exitSize: S(0.50), entry_snapshot: null, exit_snapshot: null }, // win

    { id: 5,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: 'Scalp',
      entryTime: isoDaysAgo(4, 9, 55),  entryPrice: S(2446.9, 1), entrySize: S(0.20),
      exitTime: isoDaysAgo(4, 10, 35), exitPrice: S(2448.7, 1), exitSize: S(0.20), entry_snapshot: null, exit_snapshot: null }, // win

    { id: 6,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: 'Stop out',
      entryTime: isoDaysAgo(5, 11, 15), entryPrice: S(2454.2, 1), entrySize: S(0.50),
      exitTime: isoDaysAgo(5, 12, 5),  exitPrice: S(2451.1, 1), exitSize: S(0.50), entry_snapshot: null, exit_snapshot: null }, // loss

    { id: 7,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Sell', remarks: '',
      entryTime: isoDaysAgo(6, 9, 10),  entryPrice: S(2462.5, 1), entrySize: S(2.00),
      exitTime: isoDaysAgo(6, 11, 40), exitPrice: S(2455.6, 1), exitSize: S(2.00), entry_snapshot: null, exit_snapshot: null }, // win

    { id: 8,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: 'Open runner',
      entryTime: isoDaysAgo(7, 10, 5),  entryPrice: S(2448.4, 1), entrySize: S(0.30),
      exitTime: null, exitPrice: null, exitSize: null, entry_snapshot: null, exit_snapshot: null }, // open

    { id: 9,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Sell', remarks: '',
      entryTime: isoDaysAgo(8, 12, 30), entryPrice: S(2460.0, 1), entrySize: S(1.00),
      exitTime: isoDaysAgo(8, 13, 45), exitPrice: S(2462.8, 1), exitSize: S(1.00), entry_snapshot: null, exit_snapshot: null }, // loss

    { id:10,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: '',
      entryTime: isoDaysAgo(9, 9, 25),  entryPrice: S(2444.7, 1), entrySize: S(0.50),
      exitTime: isoDaysAgo(9, 12, 15), exitPrice: S(2448.6, 1), exitSize: S(0.50), entry_snapshot: null, exit_snapshot: null }, // win

    { id:11,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: 'Quick loss',
      entryTime: isoDaysAgo(10, 10, 0), entryPrice: S(2450.8, 1), entrySize: S(0.20),
      exitTime: isoDaysAgo(10, 10, 35), exitPrice: S(2449.2, 1), exitSize: S(0.20), entry_snapshot: null, exit_snapshot: null }, // loss

    { id:12,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Sell', remarks: 'Channel top',
      entryTime: isoDaysAgo(11, 11, 20), entryPrice: S(2463.7, 1), entrySize: S(0.50),
      exitTime: isoDaysAgo(11, 15, 10), exitPrice: S(2456.9, 1), exitSize: S(0.50), entry_snapshot: null, exit_snapshot: null }, // win

    { id:13,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: '',
      entryTime: isoDaysAgo(12, 9, 45),  entryPrice: S(2447.1, 1), entrySize: S(1.00),
      exitTime: isoDaysAgo(12, 12, 55), exitPrice: S(2445.0, 1), exitSize: S(1.00), entry_snapshot: null, exit_snapshot: null }, // loss

    { id:14,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Sell', remarks: 'Scalp',
      entryTime: isoDaysAgo(13, 10, 50), entryPrice: S(2461.2, 1), entrySize: S(0.20),
      exitTime: isoDaysAgo(13, 11, 30), exitPrice: S(2459.8, 1), exitSize: S(0.20), entry_snapshot: null, exit_snapshot: null }, // win

    { id:15,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Buy',  remarks: 'Multi-leg',
      entryTime: isoDaysAgo(14, 9, 30),  entryPrice: S(2448.0, 1), entrySize: S(0.30),
      exitTime: null, exitPrice: null, exitSize: null, entry_snapshot: null, exit_snapshot: null }, // open (legs below)

    { id:16,  symbol: 'XAUUSD.s', strategy: 'M1-MACD-RSI', position: 'Sell', remarks: '',
      entryTime: isoDaysAgo(15, 10, 0),  entryPrice: S(2465.5, 1), entrySize: S(0.30),
      exitTime: isoDaysAgo(15, 12, 40), exitPrice: S(2460.6, 1), exitSize: S(0.30), entry_snapshot: null, exit_snapshot: null }, // win
  ],

  // ---------- subentries ----------
  subentries: [
    // Trade 1 (today): two legs, one closed profit, one open
    { id: 1, trade_id: 1, position: 'Buy', remarks: 'add on pullback',
      entryTime: isoDaysAgo(0, 10, 45), entryPrice: S(2454.0, 1), entrySize: S(0.30),
      exitTime: isoDaysAgo(0, 12, 0),   exitPrice: S(2457.3, 1), exitSize: S(0.30),
      entry_snapshot: null, exit_snapshot: null },
    { id: 2, trade_id: 1, position: 'Buy', remarks: 'runner',
      entryTime: isoDaysAgo(0, 12, 20), entryPrice: S(2456.5, 1), entrySize: S(0.20),
      exitTime: null, exitPrice: null, exitSize: null,
      entry_snapshot: null, exit_snapshot: null },

    // Trade 8 (open runner from 7 days ago): two legs, last open
    { id: 3, trade_id: 8, position: 'Buy', remarks: '',
      entryTime: isoDaysAgo(7, 10, 5), entryPrice: S(2448.4, 1), entrySize: S(0.20),
      exitTime: isoDaysAgo(7, 11, 15), exitPrice: S(2449.9, 1), exitSize: S(0.20),
      entry_snapshot: null, exit_snapshot: null },
    { id: 4, trade_id: 8, position: 'Buy', remarks: 'still open',
      entryTime: isoDaysAgo(7, 12, 30), entryPrice: S(2449.1, 1), entrySize: S(0.10),
      exitTime: null, exitPrice: null, exitSize: null,
      entry_snapshot: null, exit_snapshot: null },

    // Trade 15 (multi-leg from 14 days ago): three legs, two closed and one open
    { id: 5, trade_id: 15, position: 'Buy', remarks: '',
      entryTime: isoDaysAgo(14, 9, 30), entryPrice: S(2448.0, 1), entrySize: S(0.20),
      exitTime: isoDaysAgo(14, 10, 20), exitPrice: S(2449.7, 1), exitSize: S(0.20),
      entry_snapshot: null, exit_snapshot: null },
    { id: 6, trade_id: 15, position: 'Buy', remarks: '',
      entryTime: isoDaysAgo(14, 11, 10), entryPrice: S(2448.3, 1), entrySize: S(0.20),
      exitTime: isoDaysAgo(14, 12, 40), exitPrice: S(2446.9, 1), exitSize: S(0.20), // small loss
      entry_snapshot: null, exit_snapshot: null },
    { id: 7, trade_id: 15, position: 'Buy', remarks: 'open',
      entryTime: isoDaysAgo(14, 13, 5), entryPrice: S(2447.7, 1), entrySize: S(0.10),
      exitTime: null, exitPrice: null, exitSize: null,
      entry_snapshot: null, exit_snapshot: null },
  ],
};
