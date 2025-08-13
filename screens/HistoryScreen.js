import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from '../components/Icon';
import TradeModal from '../components/TradeModal';
import EditRemarksModal from '../components/EditRemarksModal';
import RemoveEntryModal from '../components/RemoveEntryModal';
import ExitEntryModal from '../components/ExitEntryModal';
import AddSubentryModal from '../components/AddSubentryModal';
import EditSubentryEntryModal from '../components/EditSubentryEntryModal';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";


const adaptTrade = (t) => ({
  id: t.id,
  // times
  entryTime: t.entryTime ?? t.entry_time ?? t.entry_timestamp ?? t.createdAt ?? null,
  exitTime: t.exitTime ?? t.exit_time ?? t.closedAt ?? null,

  // prices & size
  entryPrice: t.entryPrice ?? t.entry_price ?? t.price ?? null,
  exitPrice: t.exitPrice ?? t.exit_price ?? null,
  entrySize: t.entrySize ?? t.entry_size ?? t.size ?? null,
  exitSize: t.exitSize ?? t.exit_size ?? null,

  // misc
  position: t.position ?? t.side ?? t.direction ?? 'Buy',
  remarks: t.remarks ?? '',
  symbol: t.symbol ?? t.instrument ?? 'XAUUSD.s',
  strategy: t.strategy ?? t.playbook ?? t.strategyName ?? 'M1-MACD-RSI',

  // snapshots
  snapshots: t.snapshots ?? {
    entry: t.entrySnapshot ?? null,
    exit: t.exitSnapshot ?? null,
  },
});


const adaptSubentry = (s) => ({
  id: s.id,
  trade_id: s.trade_id ?? s.tradeId,
  entryTime: s.entryTime ?? s.entry_time ?? null,
  exitTime: s.exitTime ?? s.exit_time ?? null,
  entryPrice: s.entryPrice ?? s.entry_price ?? null,
  exitPrice: s.exitPrice ?? s.exit_price ?? null,
  entrySize: s.entrySize ?? s.entry_size ?? null,
  exitSize: s.exitSize ?? s.exit_size ?? null,
  position: s.position ?? s.side ?? 'Buy',
  remarks: s.remarks ?? '',
  entry_snapshot: s.entry_snapshot ?? s.entrySnapshot ?? null,
  exit_snapshot: s.exit_snapshot ?? s.exitSnapshot ?? null,
});


export default function HistoryScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState('');

  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [exitTradeIndex, setExitTradeIndex] = useState(null);
  const [trades, setTrades] = useState([]);

  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotPair, setSnapshotPair] = useState({ entry: null, exit: null });


  const [editSubentryIdx, setEditSubentryIdx] = useState(null);
  const [exitSubentryIdx, setExitSubentryIdx] = useState(null);
  const [removeSubentryIdx, setRemoveSubentryIdx] = useState(null);

  const handleEditSubentry = (tradeIdx, subIdx) => setEditSubentryIdx({ tradeIdx, subIdx });
  const handleExitSubentry = (tradeIdx, subIdx) => setExitSubentryIdx({ tradeIdx, subIdx });
  const handleRemoveSubentry = (tradeIdx, subIdx) => setRemoveSubentryIdx({ tradeIdx, subIdx });

  async function fetchTrades() {
    const res = await fetch('/trades');
    const raw = await res.json();
    const tradesWithSubs = await Promise.all(
      raw.map(async (t) => {
        const trade = adaptTrade(t);
        const sres = await fetch(`/trades/${trade.id}/subentries`);
        const subsRaw = await sres.json();
        trade.subentries = subsRaw.map(adaptSubentry);
        return trade;
      })
    );
    setTrades(tradesWithSubs);
  }


  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const [addSubentryModalVisible, setAddSubentryModalVisible] = useState(false);
  const [addSubentryIndex, setAddSubentryIndex] = useState(null);


  const UPLOADS_BASE_URL = '/trades/uploads/';

  const [filterDay, setFilterDay] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState([null, null]);
  const [filterPeriod, setFilterPeriod] = useState([null, null]);

  const [showDayModal, setShowDayModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const [editEntrySubIdx, setEditEntrySubIdx] = useState(null);


  const filteredTrades = trades.filter(trade => {

    if (filterDay && filterDay.value) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const entryDate = new Date(trade.entryTime);
      if (dayNames[entryDate.getDay()] !== filterDay.value) return false;
    }

    if (filterDateRange[0] && filterDateRange[1]) {
      const entry = new Date(trade.entryTime);
      const start = new Date(filterDateRange[0]);
      const end = new Date(filterDateRange[1]);

      end.setHours(23, 59, 59, 999);
      if (entry < start || entry > end) return false;
    }

    if (filterPeriod[0] && filterPeriod[1]) {
      const entry = new Date(trade.entryTime);
      const timeStr = entry.toTimeString().substring(0, 5);
      if (timeStr < filterPeriod[0] || timeStr > filterPeriod[1]) return false;
    }
    return true;
  });

  const dayOptions = [
    { value: '', label: 'All' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' },
  ];

  const calculatePipsAndPnl = (entryPrice, exitPrice, size, position) => {
    if (!entryPrice || !exitPrice || !size || !position) return { pips: '—', pnl: '—' };
    const ePrice = parseFloat(entryPrice);
    const xPrice = parseFloat(exitPrice);
    const lotSize = parseFloat(size);
    let pips, pnl;
    if (position === 'Buy') {
      pips = (xPrice - ePrice) * 10;
      pnl = lotSize * pips * 10;
    } else if (position === 'Sell') {
      pips = (ePrice - xPrice) * 10;
      pnl = lotSize * pips * 10;
    } else {
      pips = Math.abs(xPrice - ePrice) * 10;
      pnl = lotSize * pips * 10;
    }
    return {
      pips: pips.toFixed(1),
      pnl: pnl.toFixed(2),
    };
  };

  const stats = getSummaryStats(filteredTrades);


  function FilterModal({ visible, onClose, children }) {
    if (!visible) return null;
    return (
      <div
        style={{
          position: 'fixed',
          zIndex: 10000,
          left: 0, top: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.32)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#222',
            borderRadius: 16,
            minWidth: 320,
            padding: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }


  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#222',
      borderColor: state.isFocused ? '#888' : '#444',
      minHeight: 40,
      boxShadow: 'none',
      borderRadius: 8,
      color: 'white',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#111',
      borderRadius: 8,
      zIndex: 100,
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? '#fff' : '#eee',
      backgroundColor: state.isSelected
        ? '#1ec772'
        : state.isFocused
          ? '#444'
          : '#111',
      padding: 12,
      cursor: 'pointer',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#aaa',
      '&:hover': { color: '#1ec772' },
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    input: (provided) => ({
      ...provided,
      color: 'white',
    }),
    menuPortal: base => ({
      ...base,
      zIndex: 9999,
    }),

    menuList: (provided) => ({
      ...provided,

      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      maxHeight: 300,
      overflowY: 'auto',

      '::-webkit-scrollbar': {
        display: 'none',
      },
    }),
  };



  function getSummaryStats(trades) {
    let totalRevenue = 0;
    let totalEntries = 0;
    let totalPips = 0;
    let sessionWin = 0;
    let sessionLoss = 0;
    let totalHoldTimeMs = 0;
    let holdCount = 0;

    for (const trade of trades) {

      const subentries = trade.subentries || [];
      let sessionPnl = 0;
      let sessionPips = 0;

      if (subentries.length > 0) {
        for (const sub of subentries) {
          const { pips, pnl } = calculatePipsAndPnl(
            sub.entryPrice,
            sub.exitPrice,
            sub.entrySize,
            sub.position
          );
          sessionPips += isNaN(Number(pips)) ? 0 : Number(pips);
          sessionPnl += isNaN(Number(pnl)) ? 0 : Number(pnl);
        }
      } else if (trade.exitTime && trade.exitPrice && trade.exitSize) {
        const { pips, pnl } = calculatePipsAndPnl(
          trade.entryPrice,
          trade.exitPrice,
          trade.entrySize,
          trade.position
        );
        sessionPips += isNaN(Number(pips)) ? 0 : Number(pips);
        sessionPnl += isNaN(Number(pnl)) ? 0 : Number(pnl);
      }

      totalPips += sessionPips;
      totalRevenue += sessionPnl;


      if (sessionPnl > 0) sessionWin += 1;
      else if (sessionPnl < 0) sessionLoss += 1;

      totalEntries += 1;


      let entryTime = trade.entryTime;
      let exitTime = trade.exitTime;
      if (subentries.length > 0) {
        entryTime = subentries[0]?.entryTime;
        exitTime = subentries[subentries.length - 1]?.exitTime;
      }
      const start = new Date(entryTime);
      const end = new Date(exitTime);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        totalHoldTimeMs += (end - start);
        holdCount++;
      }
    }


    const avgHoldMin = holdCount > 0 ? (totalHoldTimeMs / holdCount / 1000 / 60).toFixed(0) : 0;

    return {
      revenue: totalRevenue.toFixed(2),
      totalEntries,
      totalPips: totalPips.toFixed(1),
      win: sessionWin,
      loss: sessionLoss,
      avgHoldMin,
    };
  }


  async function updateTradeRemarks(tradeId, newRemarks) {
    const res = await fetch(`/trades/${tradeId}/remarks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks: newRemarks }),
    });
    if (!res.ok) throw new Error('Failed to update remarks');
    return await res.json();
  }

  function SnapshotViewerModal({ visible, src, onClose }) {
    if (!visible) return null;
    return (
      <div
        style={{
          position: 'fixed',
          zIndex: 9999,
          left: 0, top: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <img
          src={src}
          alt="Full Snapshot"
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 32,
            right: 32,
            fontSize: 28,
            background: 'transparent',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >×</button>
      </div>
    );
  }

  async function updateTradeExit(tradeId, { exitPrice, exitSize, exitTime, exitSnapshot, prevExitSnapshot }) {
    const formData = new FormData();
    formData.append('exit_price', exitPrice);
    formData.append('exit_size', exitSize);
    formData.append('exit_time', exitTime);
    if (exitSnapshot) {
      formData.append('exit_snapshot', exitSnapshot);
    }
    if (prevExitSnapshot) {
      formData.append('prev_exit_snapshot', prevExitSnapshot);
    }

    const res = await fetch(`/trades/${tradeId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to update exit info');
    return await res.json();
  }






  useEffect(() => {
    fetchTrades();
  }, []);

  function getSessionAggregates(trade) {
    const subentries = trade.subentries || [];
    if (!subentries.length) {
      let totalPips = '', totalPnl = '';
      if (trade.exitTime && trade.exitPrice && trade.entryPrice && trade.entrySize) {
        const res = calculatePipsAndPnl(trade.entryPrice, trade.exitPrice, trade.entrySize, trade.position);
        totalPips = res.pips; totalPnl = res.pnl;
      }
      return {
        entryTime: trade.entryTime,
        entryPrice: trade.entryPrice,
        entrySize: trade.entrySize,
        position: trade.position,
        exitTime: trade.exitTime,
        exitPrice: trade.exitPrice,
        exitSize: trade.exitSize,
        totalPips,
        totalPnl,
      };
    }


    const byEntry = [...subentries].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    const byExit = [...subentries].sort((a, b) => new Date(a.exitTime || 0) - new Date(b.exitTime || 0));

    const entryPrice = byEntry[0]?.entryPrice;
    const entryTime = byEntry[0]?.entryTime;
    const entrySize = subentries.reduce((sum, e) => sum + parseFloat(e.entrySize || 0), 0);
    const position = byEntry[0]?.position;

    const lastExit = byExit.reverse().find(e => e.exitTime);
    const exitTime = lastExit?.exitTime || null;
    const exitPrice = lastExit?.exitPrice || null;
    const exitSize = lastExit?.exitSize || null;


    let totalPips = 0, totalPnl = 0;
    for (const sub of subentries) {
      const { pips, pnl } = calculatePipsAndPnl(
        sub.entryPrice,
        sub.exitPrice,
        sub.entrySize,
        sub.position
      );
      totalPips += isNaN(Number(pips)) ? 0 : Number(pips);
      totalPnl += isNaN(Number(pnl)) ? 0 : Number(pnl);
    }

    return {
      entryTime,
      entryPrice,
      entrySize,
      position,
      exitTime,
      exitPrice,
      exitSize,
      totalPips: totalPips.toFixed(1),
      totalPnl: totalPnl.toFixed(2),
    };
  }






  return (
    <View style={styles.container}>

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.logo}>tbuuk.</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.sidebar}>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Icon name="time-outline" size={28} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Icon name="add-circle-outline" size={30} style={styles.icon} />
        </TouchableOpacity>
      </View>


      <View style={styles.mainContent}>


        <View style={styles.summaryBoard}>
          <View style={styles.summaryBoardLeft}>
            <View style={styles.summaryBoardLeftRow1}>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Strategy</Text>
                <Text style={styles.summaryValue}>M1-MACD-RSI</Text>
              </View>

            </View>
            <View style={styles.summaryBoardLeftRow1}>

              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Symbol</Text>
                <Text style={styles.summaryValue}>XAUUSD.s</Text>
              </View>
            </View>
            <View style={styles.summaryBoardLeftRow2}>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Revenue (USD)</Text>
                <Text style={styles.summaryValue}>{stats.revenue}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Total Entries</Text>
                <Text style={styles.summaryValue}>{stats.totalEntries}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Total Pips</Text>
                <Text style={styles.summaryValue}>{stats.totalPips}</Text>
              </View>


            </View>
            <View style={styles.summaryBoardLeftRow2}>

              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Win</Text>
                <Text style={styles.summaryValue}>{stats.win}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Loss</Text>
                <Text style={styles.summaryValue}>{stats.loss}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Avg Time (min)</Text>
                <Text style={styles.summaryValue}>{stats.avgHoldMin}</Text>
              </View>

            </View>
          </View>
          <View style={styles.summaryBoardRight}>

            <View style={styles.summaryBoardRightContent}>
              <Text style={styles.summaryRightTitle}>Filter Day</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#222',
                  borderRadius: 8,
                  padding: 8,
                  minWidth: 140,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#444',
                }}
                onPress={() => setShowDayModal(true)}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>
                  {filterDay && filterDay.label ? filterDay.label : 'All'}
                </Text>
              </TouchableOpacity>
            </View>


            <View style={styles.summaryBoardRightContent}>
              <Text style={styles.summaryRightTitle}>Date Range</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#222',
                  borderRadius: 8,
                  padding: 8,
                  minWidth: 140,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#444',
                }}
                onPress={() => setShowDateModal(true)}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>
                  {filterDateRange[0] && filterDateRange[1]
                    ? `${filterDateRange[0].toLocaleDateString()} ~ ${filterDateRange[1].toLocaleDateString()}`
                    : 'All'}
                </Text>
              </TouchableOpacity>
            </View>


            <View style={styles.summaryBoardRightContent}>
              <Text style={styles.summaryRightTitle}>Period</Text>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between', }}>
                <input
                  type="time"
                  value={filterPeriod[0] || ''}
                  onChange={e => setFilterPeriod([e.target.value, filterPeriod[1]])}
                  style={{
                    flex: 1,
                    backgroundColor: '#333',
                    color: 'white',
                    borderRadius: 6,
                    border: 0,
                    padding: 3,
                  }}
                />
                <span style={{ color: 'white' }}>-</span>
                <input
                  type="time"
                  value={filterPeriod[1] || ''}
                  onChange={e => setFilterPeriod([filterPeriod[0], e.target.value])}
                  style={{
                    flex: 1,
                    backgroundColor: '#333',
                    color: 'white',
                    borderRadius: 6,
                    border: 0,
                    padding: 3,
                  }}
                />
              </View>
            </View>


            <TouchableOpacity
              style={styles.summaryBoardRightReset}
              onPress={() => {
                setFilterDay(null);
                setFilterDateRange([null, null]);
                setFilterPeriod([null, null]);
              }}
            >
              <Text style={styles.summaryBoardRightReset}>Clear</Text>
            </TouchableOpacity>
          </View>


        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
          <View>

            <View style={styles.historyLabelRow}>
              <Text style={styles.indicatorHeader}></Text>
              <Text style={styles.historyCellHeader}>Entry Time</Text>
              <Text style={styles.historyCellHeader}>Entry Price</Text>
              <Text style={styles.historyCellHeader}>Entry Size</Text>
              <Text style={styles.historyCellHeader}>Position</Text>
              <Text style={styles.historyCellHeader}>Exit Time</Text>
              <Text style={styles.historyCellHeader}>Exit Price</Text>
              <Text style={styles.historyCellHeader}>Exit Size</Text>
              <Text style={styles.historyCellHeader}>Total Pip</Text>
              <Text style={styles.historyCellHeader}>Profit/Loss</Text>
              <Text style={[styles.historyCellHeader, styles.remarksCell]}>Remarks</Text>
            </View>

            {filteredTrades.length === 0 && (
              <Text style={{ color: '#fff', textAlign: 'center', marginTop: 32 }}>
                No trades to display.
              </Text>
            )}




            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {filteredTrades.map((trade, i) => {

                const agg = getSessionAggregates(trade);
                const sessionPnl = agg.totalPnl;
                const subentries = trade.subentries || [];

                return (
                  <View key={i}>
                    <TouchableOpacity
                      style={styles.historyListRow}
                      onPress={() => setExpandedRow(expandedRow === i ? null : i)}
                    >

                      <View
                        style={[
                          styles.indicatorCell,
                          {
                            backgroundColor:
                              sessionPnl > 0 ? '#1ec772' : sessionPnl < 0 ? '#e14c4c' : '#888',
                          },
                        ]}
                      />

                      <Text style={styles.historyCell}>{formatDate(agg.entryTime) || '-'}</Text>
                      <Text style={styles.historyCell}>{agg.entryPrice || '-'}</Text>
                      <Text style={styles.historyCell}>{agg.entrySize || '-'}</Text>
                      <Text style={styles.historyCell}>{agg.position || '-'}</Text>
                      <Text style={styles.historyCell}>{formatDate(agg.exitTime) || '-'}</Text>
                      <Text style={styles.historyCell}>{agg.exitPrice || '-'}</Text>
                      <Text style={styles.historyCell}>{agg.exitSize || '-'}</Text>
                      <Text style={styles.historyCell}>{agg.totalPips || '-'}</Text>
                      <Text style={styles.historyCell}>{agg.totalPnl || '-'}</Text>
                      <Text style={[styles.historyCellHeader, styles.remarksCell, { color: 'black', fontWeight: 'normal' }]}>{trade.remarks || '-'}</Text>

                    </TouchableOpacity>


                    {expandedRow === i && (
                      <>
                        {expandedRow === i && (
                          <>

                            <View style={[styles.actionRow, { marginBottom: 13 }]}>
                              <TouchableOpacity
                                style={styles.mainActionButton}
                                onPress={() => {
                                  setAddSubentryIndex(i);
                                  setAddSubentryModalVisible(true);
                                }}>
                                <Text style={styles.mainActionButtonText}>Add Entry</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.mainActionButton}
                                onPress={() => {
                                  setSelectedRemarks(trade.remarks);
                                  setEditModalVisible(true);
                                }}>
                                <Text style={styles.mainActionButtonText}>Remark</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.mainActionButton, { backgroundColor: '#e14c4c' }]}
                                onPress={() => setRemoveModalVisible(true)}>
                                <Text style={styles.actionButtonText}>Remove</Text>
                              </TouchableOpacity>
                            </View>




                            {subentries.length === 0 && (
                              <Text style={{ color: '#ccc', marginLeft: 30, marginTop: 8 }}>
                                No entries in this session.
                              </Text>
                            )}
                            {subentries.map((sub, j) => {
                              const { pips: subPips, pnl: subPnl } = calculatePipsAndPnl(
                                sub.entryPrice,
                                sub.exitPrice,
                                sub.entrySize,
                                sub.position
                              );
                              return (
                                <View key={j}>
                                  <View style={styles.subentryRow}>
                                    <View
                                      style={[
                                        styles.indicatorCell,
                                        {
                                          backgroundColor:
                                            subPnl > 0 ? '#1ec772' : subPnl < 0 ? '#e14c4c' : '#888',
                                        },
                                      ]}
                                    />
                                    <Text style={styles.subCell}>{formatDate(sub.entryTime) || '-'}</Text>
                                    <Text style={styles.subCell}>{sub.entryPrice || '-'}</Text>
                                    <Text style={styles.subCell}>{sub.entrySize || '-'}</Text>
                                    <Text style={styles.subCell}>{sub.position || '-'}</Text>
                                    <Text style={styles.subCell}>{formatDate(sub.exitTime) || '-'}</Text>
                                    <Text style={styles.subCell}>{sub.exitPrice || '-'}</Text>
                                    <Text style={styles.subCell}>{sub.exitSize || '-'}</Text>
                                    <Text style={styles.subCell}>{subPips || '-'}</Text>
                                    <Text style={styles.subCell}>{subPnl || '-'}</Text>
                                    <Text style={[styles.subCell, styles.remarksCell]}>
                                      {sub.remarks || '-'}
                                    </Text>

                                  </View>

                                  <View style={styles.actionRow}>

                                    <TouchableOpacity
                                      style={styles.actionButton}
                                      onPress={() => setEditEntrySubIdx({ tradeIdx: i, subIdx: j })}
                                    >
                                      <Text style={styles.actionButtonText}>Entry</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={styles.actionButton}
                                      onPress={() => handleExitSubentry(i, j)}>
                                      <Text style={styles.actionButtonText}>Exit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.actionButton}
                                      onPress={() => handleEditSubentry(i, j)}>
                                      <Text style={styles.actionButtonText}>Remark</Text>
                                    </TouchableOpacity>



                                    <TouchableOpacity
                                      style={[styles.actionButton, { backgroundColor: '#e14c4c' }]}
                                      onPress={() => handleRemoveSubentry(i, j)}>
                                      <Text style={styles.actionButtonText}>Remove</Text>
                                    </TouchableOpacity>
                                  </View>

                                  <View style={styles.subSnapshotRow}>
                                    <View style={styles.snapshotBox}>
                                      {sub.entry_snapshot ? (
                                        <img
                                          src={`${UPLOADS_BASE_URL}${sub.entry_snapshot}`}
                                          alt="Subentry Entry Snapshot"
                                          style={{

                                            height: 500,
                                            borderRadius: 6,
                                            background: '#444',
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                          }}
                                          onClick={() =>
                                            setSnapshotPair({
                                              entry: `${UPLOADS_BASE_URL}${sub.entry_snapshot}`,
                                              exit: sub.exit_snapshot ? `${UPLOADS_BASE_URL}${sub.exit_snapshot}` : null,
                                            }) || setSnapshotModalOpen(true)
                                          }
                                        />
                                      ) : (
                                        <div style={{ width: '100%', height: 80, background: '#444', borderRadius: 6 }} />
                                      )}
                                    </View>
                                    <View style={styles.snapshotBox}>
                                      {sub.exit_snapshot ? (
                                        <img
                                          src={`${UPLOADS_BASE_URL}${sub.exit_snapshot}`}
                                          alt="Subentry Exit Snapshot"
                                          style={{

                                            height: 500,
                                            borderRadius: 6,
                                            background: '#444',
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                          }}
                                          onClick={() =>
                                            setSnapshotPair({
                                              entry: sub.entry_snapshot ? `${UPLOADS_BASE_URL}${sub.entry_snapshot}` : null,
                                              exit: `${UPLOADS_BASE_URL}${sub.exit_snapshot}`,
                                            }) || setSnapshotModalOpen(true)
                                          }
                                        />
                                      ) : (
                                        <div style={{ width: '100%', height: 80, background: '#444', borderRadius: 6 }} />
                                      )}
                                    </View>
                                  </View>


                                </View>
                              );
                            })}
                          </>
                        )}

                      </>
                    )}
                  </View>
                );
              })}


            </ScrollView>
          </View>
        </ScrollView>



      </View>

      <TradeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmitted={fetchTrades}
      />


      <EditRemarksModal
        visible={editModalVisible}
        currentRemarks={trades[expandedRow]?.remarks || ''}
        onClose={() => setEditModalVisible(false)}
        onSubmit={async (newRemarks) => {
          const tradeId = trades[expandedRow]?.id;
          if (tradeId) {
            await updateTradeRemarks(tradeId, newRemarks);

            const res = await fetch('/trades');
            const json = await res.json();
            setTrades(json);
          }
          setEditModalVisible(false);
        }}
      />


      <RemoveEntryModal
        visible={removeModalVisible}
        onClose={() => setRemoveModalVisible(false)}
        message="Are you sure you want to remove this entry and all its subentries?"
        onConfirm={async () => {
          if (expandedRow !== null && trades[expandedRow]?.id) {
            await fetch(`/trades/${trades[expandedRow].id}`, { method: 'DELETE' });
            const updated = await fetch('/trades');
            setTrades(await updated.json());
            setRemoveModalVisible(false);
            setExpandedRow(null);
          }
        }}
      />



      <ExitEntryModal
        visible={exitModalVisible}
        onClose={() => {
          setExitModalVisible(false);
          setExitTradeIndex(null);
        }}
        entryPrice={exitTradeIndex !== null ? trades[exitTradeIndex]?.entryPrice : ''}
        entrySize={exitTradeIndex !== null ? trades[exitTradeIndex]?.entrySize : ''}
        onSubmit={async (exitData) => {
          const tradeId = trades[exitTradeIndex]?.id;
          try {
            await updateTradeExit(tradeId, {
              exitPrice: exitData.exitPrice,
              exitSize: exitData.exitSize,
              exitTime: exitData.exitTime,
              exitSnapshot: exitData.exitSnapshot,
              prevExitSnapshot: trades[exitTradeIndex]?.exit_snapshot || '',
            });


            const res = await fetch('/trades');
            const json = await res.json();
            setTrades(json);
            setExitModalVisible(false);
            setExitTradeIndex(null);
          } catch (err) {
            alert('Failed to update exit trade!');
            console.error(err);
          }
        }}
      />



      <AddSubentryModal
        visible={addSubentryModalVisible}
        onClose={() => {
          setAddSubentryModalVisible(false);
          setAddSubentryIndex(null);
        }}
        mainEntryPrice={addSubentryIndex !== null ? trades[addSubentryIndex]?.entry_price : ''}
        onSubmit={async (subentryData) => {
          const tradeId = trades[addSubentryIndex]?.id;
          try {
            const formData = new FormData();
            formData.append('entry_time', subentryData.entry_time);
            formData.append('entry_price', subentryData.entry_price);
            formData.append('entry_size', subentryData.entry_size);
            formData.append('remarks', subentryData.remarks || '');
            formData.append('position', subentryData.position);
            if (subentryData.entry_snapshot) {
              formData.append('entry_snapshot', subentryData.entry_snapshot);
            }
            await fetch(`/trades/${tradeId}/subentries`, {
              method: 'POST',
              body: formData,
            });

            const res = await fetch('/trades');
            setTrades(await res.json());
            setAddSubentryModalVisible(false);
            setAddSubentryIndex(null);
          } catch (err) {
            alert('Failed to add subentry!');
          }
        }}

      />


      <EditSubentryEntryModal
        visible={!!editEntrySubIdx}
        subentry={
          editEntrySubIdx
            ? trades[editEntrySubIdx.tradeIdx]?.subentries[editEntrySubIdx.subIdx]
            : null
        }
        onClose={() => setEditEntrySubIdx(null)}
        onSaved={fetchTrades}
      />






      {removeSubentryIdx && (
        <RemoveEntryModal
          visible={true}
          onClose={() => setRemoveSubentryIdx(null)}
          message="Are you sure you want to remove this subentry?"
          onConfirm={async () => {
            const subentry = trades[removeSubentryIdx.tradeIdx]?.subentries[removeSubentryIdx.subIdx];
            if (subentry?.id) {
              await fetch(`/subentries/${subentry.id}`, { method: 'DELETE' });
              const res = await fetch('/trades');
              setTrades(await res.json());
            }
            setRemoveSubentryIdx(null);
          }}
        />
      )}



      {exitSubentryIdx && (
        <ExitEntryModal
          visible={true}
          entryPrice={
            trades[exitSubentryIdx.tradeIdx]?.subentries[exitSubentryIdx.subIdx]?.entryPrice
          }
          entrySize={
            trades[exitSubentryIdx.tradeIdx]?.subentries[exitSubentryIdx.subIdx]?.entrySize
          }
          onClose={() => setExitSubentryIdx(null)}
          onSubmit={async (exitData) => {

            const subentry =
              trades[exitSubentryIdx.tradeIdx]?.subentries[exitSubentryIdx.subIdx];
            if (subentry?.id) {
              const formData = new FormData();
              formData.append('exit_time', exitData.exitTime);
              formData.append('exit_price', exitData.exitPrice);
              formData.append('exit_size', exitData.exitSize);
              if (exitData.exitSnapshot) {
                formData.append('exit_snapshot', exitData.exitSnapshot);
              }

              await fetch(`/trades/subentries/${subentry.id}/exit`, {
                method: 'PUT',
                body: formData,
              });

              const res = await fetch('/trades');
              setTrades(await res.json());
            }
            setExitSubentryIdx(null);
          }}
        />
      )}





      <FilterModal visible={showDayModal} onClose={() => setShowDayModal(false)}>
        <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 12 }}>Select Day</Text>
        <Select
          options={dayOptions}
          value={filterDay}
          onChange={day => {
            setFilterDay(day);
            setShowDayModal(false);
          }}
          isSearchable={false}
          styles={customStyles}
          autoFocus
          menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        />
        <button
          onClick={() => setShowDayModal(false)}
          style={{
            marginTop: 18, background: '#444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', width: '100%'
          }}>
          Close
        </button>
      </FilterModal>


      <FilterModal visible={showDateModal} onClose={() => setShowDateModal(false)}>

        <style>
          {`
      .react-datepicker {
        background: #1f1f1f !important;
        border: 1px solid #333 !important;
        color: #e8e8e8 !important;
        box-sizing: border-box;
      }
      .react-datepicker__header {
        background: #232323 !important;
        border-bottom: 1px solid #333 !important;
      }
      .react-datepicker__current-month,
      .react-datepicker-year-header {
        color: #fff !important;
      }
      .react-datepicker__day-name,
      .react-datepicker__day,
      .react-datepicker__time-name {
        color: #d8d8d8 !important;
      }
      .react-datepicker__day:hover {
        background: #2b2b2b !important;
      }

   
      .react-datepicker__day--in-range {
        background: rgba(13, 212, 123, 0.18) !important;
        color: #eafff5 !important;
      }
      .react-datepicker__day--in-selecting-range {
        background: rgba(13, 212, 123, 0.28) !important;
        color: #eafff5 !important;
      }
      .react-datepicker__day--range-start,
      .react-datepicker__day--range-end,
      .react-datepicker__day--selected,
      .react-datepicker__day--keyboard-selected {
        background: #0dd47b !important;
        color: #101010 !important;
      }

    
      .react-datepicker__day--outside-month,
      .react-datepicker__day--disabled {
        color: #666 !important;
        background: transparent !important;
      }

   
      .react-datepicker__week-number { color: #aaa !important; }
      .react-datepicker__navigation-icon::before {
        border-color: #e0e0e0 !important;
      }
    `}
        </style>


        <div style={{ display: 'grid', placeItems: 'center', padding: 12 }}>
          <DatePicker
            inline
            selectsRange
            startDate={filterDateRange[0]}
            endDate={filterDateRange[1]}
            onChange={(dates) => setFilterDateRange(dates)}
            dateFormat="yyyy-MM-dd"
            isClearable
            calendarStartDay={1}
            showWeekNumbers
          />

          <button
            onClick={() => setShowDateModal(false)}
            style={{
              marginTop: 10,
              width: '100%',
              background: '#343434',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </FilterModal>


      {snapshotModalOpen && (
        <div
          style={{
            position: 'fixed',
            left: 0, top: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setSnapshotModalOpen(false)}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 40,
              background: 'none',
              alignItems: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            {snapshotPair.entry && (
              <img
                src={snapshotPair.entry}
                alt="Entry Snapshot"
                style={{
                  maxWidth: '40vw',
                  maxHeight: '75vh',
                  borderRadius: 10,
                  background: '#444',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
              />
            )}
            {snapshotPair.exit && (
              <img
                src={snapshotPair.exit}
                alt="Exit Snapshot"
                style={{
                  maxWidth: '40vw',
                  maxHeight: '75vh',
                  borderRadius: 10,
                  background: '#444',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
              />
            )}
          </div>
          <button
            onClick={() => setSnapshotModalOpen(false)}
            style={{
              position: 'fixed',
              top: 32,
              right: 32,
              fontSize: 28,
              background: 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10000,
            }}
          >×</button>
        </div>
      )}







    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#1e1e1e',
  },
  topBar: {
    height: 50,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sidebar: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 60,
    bottom: 0,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    paddingTop: 10,
    zIndex: 1000,
  },
  icon: {
    marginVertical: 20,
  },
  mainContent: {
    marginLeft: 60,
    flex: 1,

  },

  summaryBoard: {

    flexDirection: 'row',
    alignItems: 'flex-start',

  },

  summaryBoardLeft: {
    flex: 0.7,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 30,
  },

  summaryBoardLeftRow1: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  summaryBoardLeftRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },

  summaryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 20,
  },

  summaryValue: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },

  summaryTitle: {
    fontSize: 10,
    color: 'white',
  },

  summaryBoardRight: {
    flex: 0.3,
    alignItems: 'center',
    padding: 10,
  },

  summaryBoardRightContent: {
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },

  summaryRightTitle: {
    fontSize: 8,
    color: 'white',
  },

  summaryRightValue: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },

  summaryBoardRightReset: {
    fontSize: 12,
    color: 'black',
    fontWeight: 'bold',
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 5,
    textAlign: 'center',
    width: '100%',
  },
  historyLabel: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  historyLabelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    color: 'white',
    fontSize: 12,
    height: 30,
  },

  historyList: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'red',
  },

  historyListContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',


  },


  historyCellHeader: {
    width: 170,
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',

  },

  historyList: {
    maxHeight: '100%',
  },

  historyListRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
    borderRadius: 8,
    paddingVertical: 10,
  },

  historyCell: {
    width: 170,
    fontSize: 12,
    textAlign: 'left',
    color: '#333',

  },

  indicatorHeader: {
    width: 70,

  },

  indicatorCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 18,



  },

  historyLabelRow: {
    flexDirection: 'row',
    paddingVertical: 10,

  },

  historyListRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 10,
    alignItems: 'center',
  },



  snapshotRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#222',
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 10,
    gap: 10,
  },

  snapshotBox: {

  },

  snapshotLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5,
  },

  snapshotPreview: {
    width: '100%',
    height: 100,
    backgroundColor: '#555',
    borderRadius: 8,
  },

  subentryRow: {
    flexDirection: 'row',
    backgroundColor: '#333',
    marginBottom: 2,
    marginHorizontal: 10,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },

  subCell: {
    width: 170,
    fontSize: 12,
    color: 'white',
    textAlign: 'left',
  },

  subSnapshotRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1a1a1a',
    marginBottom: 10,
    marginHorizontal: 20,
    borderRadius: 6,
    gap: 10,
  },

  subSnapshotLabel: {
    color: '#ccc',
    fontSize: 10,
    marginBottom: 4,
  },

  subSnapshotPreview: {
    width: '100%',
    height: 80,
    backgroundColor: '#444',
    borderRadius: 6,
  },

  actionRow: {
    flexDirection: 'row',

    paddingHorizontal: 10,
    marginTop: 10,
    gap: 10,
  },

  mainActionButton: {
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  mainActionButtonText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '600',
  },


  actionButton: {
    backgroundColor: '#444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  remarksCell: {
    width: 260,

  },




});
