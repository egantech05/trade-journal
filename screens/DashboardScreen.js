// screens/DashboardScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Entypo, MaterialIcons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-chart-kit';
import TradeModal from '../components/TradeModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// ---------- helpers ----------
const toNum = (v) => (v == null ? NaN : parseFloat(v));
const ymd = (d) => {
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
};
const fmtDayRange = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
const weekRangeFromDate = (any) => {
  const d = new Date(any);
  const wd = d.getDay(); // 0..6 (Sun..Sat)
  const mon = new Date(d);
  mon.setDate(d.getDate() + (wd === 0 ? -6 : 1 - wd));
  mon.setHours(0, 0, 0, 0);
  const sat = new Date(mon);
  sat.setDate(mon.getDate() + 5);
  sat.setHours(23, 59, 59, 999);
  return { monday: mon, saturday: sat };
};
const monthRange = (d) => ({
  first: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0),
  last: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
});
const calcPnl = (e, x, s, pos) => {
  const E = toNum(e), X = toNum(x), S = toNum(s);
  if ([E, X, S].some(Number.isNaN) || !pos) return 0;
  const pips = pos === 'Buy' ? (X - E) * 10 : pos === 'Sell' ? (E - X) * 10 : Math.abs(X - E) * 10;
  return S * pips * 10;
};

// normalize both camelCase and snake_case coming from mock/db
const adaptTrade = (t) => ({
  ...t,
  id: t.id,
  position: t.position ?? t.side ?? 'Buy',
  entryTime: t.entryTime ?? t.entry_time ?? t.createdAt ?? null,
  exitTime: t.exitTime ?? t.exit_time ?? null,
  entryPrice: t.entryPrice ?? t.entry_price ?? t.price ?? null,
  exitPrice: t.exitPrice ?? t.exit_price ?? null,
  entrySize: t.entrySize ?? t.entry_size ?? t.size ?? null,
  exitSize: t.exitSize ?? t.exit_size ?? null,
  strategy: t.strategy ?? t.playbook ?? 'M1-MACD-RSI',
  symbol: t.symbol ?? t.instrument ?? 'XAUUSD.s',
});
const adaptSub = (s) => ({
  ...s,
  id: s.id,
  trade_id: s.trade_id ?? s.tradeId,
  position: s.position ?? s.side ?? 'Buy',
  entryTime: s.entryTime ?? s.entry_time ?? null,
  exitTime: s.exitTime ?? s.exit_time ?? null,
  entryPrice: s.entryPrice ?? s.entry_price ?? null,
  exitPrice: s.exitPrice ?? s.exit_price ?? null,
  entrySize: s.entrySize ?? s.entry_size ?? null,
  exitSize: s.exitSize ?? s.exit_size ?? null,
});

// ---------- component ----------
export default function DashboardScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);

  // data
  const [trades, setTrades] = useState([]);
  const [equityChart, setEquityChart] = useState({ labels: [], datasets: [{ data: [] }] });
  const [weeklyValues, setWeeklyValues] = useState([0, 0, 0, 0, 0, 0]);
  const [monthlyPL, setMonthlyPL] = useState({});

  // layout
  const [equityWidth, setEquityWidth] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  // date pickers
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { monday, saturday } = useMemo(() => weekRangeFromDate(selectedDate), [selectedDate]);
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => new Date());
  useEffect(() => setCalendarMonthDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)), [selectedDate]);

  // fetch trades + subentries once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/trades');
        const raw = await res.json();
        const enriched = await Promise.all(
          raw.map(async (t) => {
            const trade = adaptTrade(t);
            // pull subentries so all charts see multi-leg sessions
            const sres = await fetch(`/trades/${trade.id}/subentries`);
            const subs = await sres.json();
            trade.subentries = subs.map(adaptSub);
            return trade;
          })
        );
        setTrades(enriched);
      } catch (e) {
        console.error('Failed loading trades:', e);
        setTrades([]);
      }
    })();
  }, []);

  // recompute charts whenever data/date changes
  useEffect(() => {
    buildEquity(trades);
  }, [trades]);

  useEffect(() => {
    buildWeekly(trades, monday, saturday);
  }, [trades, monday, saturday]);

  useEffect(() => {
    buildMonthly(trades, calendarMonthDate);
  }, [trades, calendarMonthDate]);

  // ---------- builders ----------
  function buildEquity(all) {
    // closed legs -> point; else closed trade without subs
    const points = [];
    for (const t of all) {
      const subs = t.subentries || [];
      if (subs.length) {
        for (const s of subs) {
          if (s.exitTime && s.exitPrice && s.exitSize) {
            points.push({
              when: +new Date(s.exitTime),
              pnl: calcPnl(s.entryPrice, s.exitPrice, s.entrySize, s.position),
            });
          }
        }
      } else if (t.exitTime && t.exitPrice && t.exitSize) {
        points.push({
          when: +new Date(t.exitTime),
          pnl: calcPnl(t.entryPrice, t.exitPrice, t.exitSize, t.position),
        });
      }
    }
    points.sort((a, b) => a.when - b.when);

    let cum = 0;
    const data = points.map((p) => +(cum += (p.pnl || 0), cum.toFixed(2)));
    const labels = data.map(() => ''); // minimalist axis
    setEquityChart({ labels, datasets: [{ data }] });
  }

  function buildWeekly(all, weekStart, weekEnd) {
    const inWeek = (d) => d >= weekStart && d <= weekEnd;
    const byDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    const add = (iso, val) => {
      if (!iso) return;
      const t = new Date(iso);
      if (!inWeek(t)) return;
      const key = t.toLocaleDateString('en-GB', { weekday: 'short' }).replace('.', '');
      if (key in byDay) byDay[key] += val;
    };

    for (const t of all) {
      const subs = t.subentries || [];
      if (subs.length) {
        for (const s of subs) {
          if (s.exitTime && s.exitPrice && s.exitSize) {
            add(s.exitTime, calcPnl(s.entryPrice, s.exitPrice, s.entrySize, s.position));
          }
        }
      } else if (t.exitTime && t.exitPrice && t.exitSize) {
        add(t.exitTime, calcPnl(t.entryPrice, t.exitPrice, t.exitSize, t.position));
      }
    }

    const today = new Date();
    const cur = weekRangeFromDate(today);
    const isThisWeek = weekStart.getTime() === cur.monday.getTime() && weekEnd.getTime() === cur.saturday.getTime();
    const todayIdx = today.getDay(); // Sun=0

    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const vals = order.map((d, idx) => {
      const v = byDay[d] || 0;
      if (!isThisWeek) return +v.toFixed(2);
      if (todayIdx === 0) return 0;
      return idx <= todayIdx - 1 ? +v.toFixed(2) : 0;
    });

    setWeeklyValues(vals);
  }

  function buildMonthly(all, anchor) {
    const { first, last } = monthRange(anchor);
    const inMonth = (d) => d >= first && d <= last;
    const map = {};

    const add = (iso, v) => {
      if (!iso) return;
      const t = new Date(iso);
      if (!inMonth(t)) return;
      const key = ymd(t);
      map[key] = (map[key] || 0) + v;
    };

    for (const t of all) {
      const subs = t.subentries || [];
      if (subs.length) {
        for (const s of subs) {
          if (s.exitTime && s.exitPrice && s.exitSize) {
            add(s.exitTime, calcPnl(s.entryPrice, s.exitPrice, s.entrySize, s.position));
          }
        }
      } else if (t.exitTime && t.exitPrice && t.exitSize) {
        add(t.exitTime, calcPnl(t.entryPrice, t.exitPrice, t.exitSize, t.position));
      }
    }

    setMonthlyPL(map);
  }

  // ---------- render ----------
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.logo}>tbuuk.</Text>
        </TouchableOpacity>
      </View>

      {/* Sidebar */}
      <View className="sidebar" style={styles.sidebar}>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Ionicons name="time-outline" size={28} color="#fff" style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <MaterialIcons name="add-circle-outline" size={30} color="#fff" style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Main */}
      <ScrollView style={styles.mainContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Text style={styles.pageTitle}>Dashboard</Text>
        </View>

        {/* Equity curve */}
        <View style={styles.fullPane} onLayout={(e) => setEquityWidth(e.nativeEvent.layout.width)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Overall Performance</Text>
            <Text style={{ color: '#9aa0a6', fontSize: 12 }}>
              Sessions: {equityChart.datasets[0]?.data?.length ?? 0}
            </Text>
          </View>

          <LineChart
            data={equityChart}
            width={Math.max(1, equityWidth - 24)}
            height={260}
            fromZero
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withShadow={false}
            yAxisSuffix=""
            yAxisLabel=""
            formatXLabel={() => ''}
            strokeWidth={2}
            chartConfig={{
              backgroundColor: '#1e1e1e',
              backgroundGradientFrom: '#1e1e1e',
              backgroundGradientTo: '#1e1e1e',
              decimalPlaces: 2,
              color: () => `rgba(13,212,123,1)`,
              labelColor: (o = 1) => `rgba(255,255,255,${o})`,
            }}
            bezier={false}
            style={{ borderRadius: 8 }}
          />
        </View>

        {/* Week picker modal */}
        {calendarOpen && (
          <>
            <style>{`
              .react-datepicker { background:#1f1f1f!important;border:1px solid #3a3a3a!important;color:#eee!important;font-family:sans-serif }
              .react-datepicker__header { background:#242424!important;border-bottom:1px solid #3a3a3a!important }
              .react-datepicker__current-month,.react-datepicker-year-header{ color:#fff!important }
              .react-datepicker__day-name,.react-datepicker__day,.react-datepicker__time-name{ color:#ddd!important }
              .react-datepicker__day:hover { background:#2c2c2c!important }
              .react-datepicker__day--selected,.react-datepicker__day--keyboard-selected{ background:#0dd47b!important;color:#111!important }
              .react-datepicker__navigation-icon::before{ border-color:#ddd!important }
              .react-datepicker__week-number{ color:#aaa!important }
            `}</style>
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}
              onClick={() => setCalendarOpen(false)}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', background: '#1f1f1f', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 42px rgba(0,0,0,0.55)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <DatePicker inline selected={selectedDate} onChange={(d) => d && setSelectedDate(d)} calendarStartDay={1} showWeekNumbers />
                <button
                  onClick={() => setCalendarOpen(false)}
                  style={{ width: '100%', background: '#333', color: '#fff', border: 'none', padding: '10px 12px', fontSize: 14, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}

        {/* Weekly + Monthly */}
        <View style={styles.row}>
          {/* Weekly */}
          <View style={styles.leftPane} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
            <Text style={styles.cardTitle}>Weekly Performance</Text>
            <TouchableOpacity
              onPress={() => setCalendarOpen(true)}
              style={{ backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#444' }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>{`${fmtDayRange(monday)} – ${fmtDayRange(saturday)}`}</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 24, paddingHorizontal: 32 }}>
              <BarChart
                data={{
                  labels: ['M', 'T', 'W', 'T', 'F', 'S'],
                  datasets: [
                    {
                      data: weeklyValues,
                      colors: weeklyValues.map((v) =>
                        v >= 0 ? (o = 1) => `rgba(0,255,153,${o})` : (o = 1) => `rgba(225,76,76,${o})`
                      ),
                    },
                  ],
                }}
                width={Math.max(1, barWidth - 32 * 2 - 24)}
                height={200}
                fromZero
                withInnerLines
                withHorizontalLabels
                withVerticalLabels
                flatColor
                withCustomBarColorFromData
                showValuesOnTopOfBars
                showBarTops={false}
                yAxisLabel=""
                yAxisSuffix=""
                yLabelsOffset={10}
                segments={4}
                formatYLabel={(v) => Number(v).toFixed(2)}
                chartConfig={{
                  backgroundColor: '#1e1e1e',
                  backgroundGradientFrom: '#1e1e1e',
                  backgroundGradientTo: '#1e1e1e',
                  decimalPlaces: 2,
                  color: (o = 1) => `rgba(255,255,255,${o})`,
                  labelColor: (o = 1) => `rgba(154,160,166,${o})`,
                  barPercentage: 0.5,
                  propsForBackgroundLines: { stroke: '#2b2b2b' },
                  propsForLabels: { fontSize: 12 },
                }}
                style={{ borderRadius: 8, paddingRight: 0 }}
              />
            </View>
          </View>

          {/* Monthly */}
          <View style={styles.rightPane}>
            <Text style={styles.cardTitle}>Monthly P/L</Text>

            <style>{`
              .react-datepicker{ background:#1f1f1f!important;border:1px solid #3a3a3a!important;color:#eee!important;font-family:sans-serif }
              .react-datepicker__header{ background:#242424!important;border-bottom:1px solid #3a3a3a!important }
              .react-datepicker__current-month,.react-datepicker-year-header{ color:#fff!important }
              .react-datepicker__day-name,.react-datepicker__day{ color:#ddd!important }
              .react-datepicker__day:hover{ background:#2c2c2c!important }
              .pl-pos .react-datepicker__day, .react-datepicker__day.pl-pos{ background:rgba(13,212,123,.9)!important;color:#111!important;border-radius:.4rem!important }
              .pl-neg .react-datepicker__day, .react-datepicker__day.pl-neg{ background:rgba(225,76,76,.9)!important;color:#111!important;border-radius:.4rem!important }
              .pl-zero .react-datepicker__day, .react-datepicker__day.pl-zero{ background:rgba(160,160,160,.35)!important;color:#fff!important;border-radius:.4rem!important }
              .react-datepicker__day--selected,.react-datepicker__day--keyboard-selected{ background:transparent!important;color:inherit!important }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <DatePicker
                inline
                selected={calendarMonthDate}
                onChange={() => {}}
                onMonthChange={(d) => d && setCalendarMonthDate(d)}
                onYearChange={(d) => d && setCalendarMonthDate(d)}
                calendarStartDay={1}
                showWeekNumbers
                dayClassName={(date) => {
                  if (date.getMonth() !== calendarMonthDate.getMonth() || date.getFullYear() !== calendarMonthDate.getFullYear()) return '';
                  const key = ymd(date);
                  const val = monthlyPL[key];
                  if (typeof val !== 'number') return '';
                  if (val > 0) return 'pl-pos';
                  if (val < 0) return 'pl-neg';
                  return 'pl-zero';
                }}
                shouldCloseOnSelect={false}
                disabledKeyboardNavigation
              />
            </div>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <View style={{ width: 12, height: 12, backgroundColor: '#0dd47b', borderRadius: 3 }} />
              <Text style={{ color: '#ccc', fontSize: 12 }}>Profit</Text>
              <View style={{ width: 12, height: 12, backgroundColor: '#e14c4c', borderRadius: 3, marginLeft: 8 }} />
              <Text style={{ color: '#ccc', fontSize: 12 }}>Loss</Text>
              <View style={{ width: 12, height: 12, backgroundColor: 'rgba(160,160,160,0.35)', borderRadius: 3, marginLeft: 8 }} />
              <Text style={{ color: '#ccc', fontSize: 12 }}>Zero / No exits</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TradeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        // refresh dashboard after a new trade is created
        onSubmitted={async () => {
          try {
            const res = await fetch('/trades');
            const raw = await res.json();
            const enriched = await Promise.all(
              raw.map(async (t) => {
                const trade = adaptTrade(t);
                const sres = await fetch(`/trades/${trade.id}/subentries`);
                const subs = await sres.json();
                trade.subentries = subs.map(adaptSub);
                return trade;
              })
            );
            setTrades(enriched);
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  topBar: { height: 50, backgroundColor: '#2a2a2a', justifyContent: 'center', paddingHorizontal: 20 },
  logo: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  sidebar: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 60,
    bottom: 0,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    paddingTop: 10,
  },
  icon: { marginVertical: 20 },

  mainContent: { marginLeft: 60, padding: 20 },
  pageTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },

  row: { flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' },

  leftPane: {
    flex: 1,
    minWidth: 360,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },

  rightPane: {
    flex: 1,
    minWidth: 360,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },

  fullPane: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
});
