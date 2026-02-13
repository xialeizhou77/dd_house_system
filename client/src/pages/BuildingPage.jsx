import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import { IconArrowLeft } from '../components/Icons';
import { BuildingMarker } from '../components/BuildingMarker';
import { useSelectionData } from '../contexts/SelectionDataContext';
import { useSelectionTimer } from '../contexts/SelectionTimerContext';
import '../styles/AerialMap.css';
import './BuildingPage.css';

const UNITS_PER_BUILDING = 44;

function parseUniqueId(id, fallbackZone, fallbackLabel) {
  if (id.startsWith('西区_')) {
    return { districtName: '西区', district: 'west', buildingNum: parseInt(id.slice(3), 10) || parseInt(fallbackLabel, 10) };
  }
  if (id.startsWith('东区_')) {
    return { districtName: '东区', district: 'east', buildingNum: parseInt(id.slice(3), 10) || parseInt(fallbackLabel, 10) };
  }
  if (id.startsWith('w-')) {
    return { districtName: '西区', district: 'west', buildingNum: parseInt(id.slice(2), 10) || parseInt(fallbackLabel, 10) };
  }
  if (id.startsWith('e-')) {
    return { districtName: '东区', district: 'east', buildingNum: parseInt(id.slice(2), 10) || parseInt(fallbackLabel, 10) };
  }
  const zone = fallbackZone === 'West' ? '西区' : '东区';
  return { districtName: zone, district: zone === '西区' ? 'west' : 'east', buildingNum: parseInt(fallbackLabel, 10) };
}

function enrichCoords(raw, buildingStats) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((b) => {
    const parsed = parseUniqueId(b.id, b.zone, b.label);
    const stats = buildingStats[b.id] || { selected: 0, unselected: UNITS_PER_BUILDING };
    return {
      ...b,
      ...parsed,
      selected: stats.selected,
      unselected: stats.unselected,
      remaining: stats.unselected,
    };
  });
}

function generateFloorUnits() {
  const units = [];
  const createCell = (floor, code, sizeHint, unit) => {
    const hash = floor * 10 + parseInt(code.slice(-1), 10);
    const status = hash % 3 === 0 ? 'sold' : 'available';
    return { code, size: sizeHint, status, unit };
  };
  for (let floor = 1; floor <= 11; floor++) {
    units.push({
      floor,
      unit2West: createCell(floor, `${floor}01`, 80, 2),
      unit2East: createCell(floor, `${floor}02`, 100, 2),
      unit1West: createCell(floor, `${floor}03`, 100, 1),
      unit1East: createCell(floor, `${floor}04`, 120, 1),
    });
  }
  return units;
}

const FLOORPLAN_BY_SIZE = {
  80: { area: 80, name: '80㎡ 两居', image: '/floorplans/80m2.png' },
  100: { area: 100, name: '100㎡ 三居', image: '/floorplans/100m2.png' },
  120: { area: 120, name: '120㎡ 三居', image: '/floorplans/120m2.png' },
};

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function BuildingPage({ round = 1 }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { rows, setRows } = useSelectionData();
  const { finishTimer, remainingMs, progress, status: timerStatus } = useSelectionTimer();
  const person = state?.person;
  const [rawCoords, setRawCoords] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const timerActive = timerStatus === 'running' || timerStatus === 'locked';

  const buildingStats = useMemo(() => {
    const stats = {};
    rows.forEach((r) => {
      const isSelected = r.firstRound === '已选' || r.secondRound === '已选';
      if (!isSelected) return;
      const key = (r.已选区 != null && r.已选楼号 != null && r.已选区 !== '' && r.已选楼号 !== '')
        ? `${r.已选区}_${r.已选楼号}`
        : r.buildingKey;
      if (!key) return;
      if (!stats[key]) stats[key] = { selected: 0 };
      stats[key].selected += 1;
    });
    Object.keys(stats).forEach((key) => {
      stats[key].unselected = Math.max(0, UNITS_PER_BUILDING - stats[key].selected);
    });
    return stats;
  }, [rows]);

  const buildings = useMemo(
    () => enrichCoords(rawCoords, buildingStats),
    [rawCoords, buildingStats],
  );

  useEffect(() => {
    api.get('/building-coords')
      .then(({ data }) => setRawCoords(data || []))
      .catch(() => setRawCoords([]));
  }, []);

  useEffect(() => {
    if (!selectionConfirmed || countdown === null) return;
    if (countdown <= 0) {
      navigate(`/house-selection`);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [selectionConfirmed, countdown, navigate]);

  if (!person) {
    navigate(`/house-selection/round${round}/start`, { replace: true });
    return null;
  }

  const orderNo = person.orderNo || person.id || '0000';
  const availableSizes = state?.availableSizes || [80, 100, 120];
  const requiredCounts = availableSizes.map((s) => ({ size: s, count: 1 }));
  const blockName = 'A块';
  const totalRemaining = 372;
  const availableSizesText = availableSizes.length
    ? [...availableSizes].sort((a, b) => a - b).map((s) => `${s}平方米`).join('、')
    : '—';

  const areaRemaining = useMemo(() => {
    const west = buildings.filter((b) => b.districtName === '西区');
    const east = buildings.filter((b) => b.districtName === '东区');
    return [
      { name: '西区', total: west.reduce((s, b) => s + (b.remaining ?? b.unselected ?? UNITS_PER_BUILDING), 0) },
      { name: '东区', total: east.reduce((s, b) => s + (b.remaining ?? b.unselected ?? UNITS_PER_BUILDING), 0) },
    ];
  }, [buildings]);

  const currentRemaining = selectedBuilding
    ? buildings.find((b) => b.id === selectedBuilding.id)?.remaining ?? 0
    : totalRemaining;

  function handleReturn() {
    navigate(`/house-selection/round${round}/start`);
  }

  function handleBuildingClick(building) {
    if (selectionConfirmed) return;
    setSelectedBuilding(building);
    setSelectedUnit(null);
  }

  function handleBackToAerial() {
    if (selectionConfirmed) return;
    setSelectedBuilding(null);
    setSelectedUnit(null);
    setShowConfirm(false);
  }

  const floorUnits = selectedBuilding ? generateFloorUnits() : [];
  const selectedPlan = selectedUnit ? FLOORPLAN_BY_SIZE[selectedUnit.size] || null : null;
  const selectedFloor = selectedUnit ? parseInt(String(selectedUnit.code).slice(0, -2), 10) || null : null;
  const confirmCommunity = selectedBuilding
    ? (selectedBuilding.district === 'west' ? '李各庄路11号院' : '李各庄路8号院')
    : '';

  function handleSubmit() {
    if (!selectedUnit || !selectedBuilding || selectionConfirmed) return;
    setShowConfirm(true);
  }

  function handleConfirmSelection() {
    finishTimer();
    if (selectedBuilding && selectedUnit && person) {
      const buildingNum = selectedBuilding.buildingNum || selectedBuilding.label;
      const districtName = selectedBuilding.districtName || (selectedBuilding.district === 'west' ? '西区' : '东区');
      const unitNum = selectedUnit.unit || 1;
      const roomCode = selectedUnit.code || '';
      const selectedUnitDisplay = `${districtName}${buildingNum}号楼 ${unitNum}单元 ${roomCode}`;
      const buildingKey = `${districtName}_${buildingNum}`;

      setRows((prev) =>
        prev.map((r) => {
          if (r.queryNo !== String(person.orderNo || person.id)) return r;
          return {
            ...r,
            已选房源: selectedUnitDisplay,
            已选区: districtName,
            已选楼号: String(buildingNum),
            buildingKey,
            ...(round === 1 ? { firstRound: '已选' } : { secondRound: '已选' }),
          };
        }),
      );
    }
    setShowConfirm(false);
    setSelectionConfirmed(true);
    setCountdown(5);
  }

  const isDisabled = selectionConfirmed;

  return (
    <div className={`building-page building-page--immersive ${isDisabled ? 'building-page--disabled' : ''}`}>
      {/* Immersive Map Background - full screen cover */}
      <div className="building-map-bg" aria-hidden />

      {/* Floating Top Bar: Countdown + Toolbar */}
      <div className="building-floating-top">
        {timerActive && (
          <div className="building-countdown-ring">
            <svg className="countdown-ring-svg" viewBox="0 0 100 100">
              <circle className="countdown-ring-bg" cx="50" cy="50" r="44" />
              <motion.circle
                className="countdown-ring-progress"
                cx="50"
                cy="50"
                r="44"
                strokeDasharray={276}
                initial={false}
                animate={{ strokeDashoffset: 276 - (progress / 100) * 276 }}
                transition={{ duration: 0.2 }}
              />
            </svg>
            <div className="countdown-ring-text">
              {formatTime(remainingMs)}
            </div>
          </div>
        )}
        <div className="building-toolbar glass-panel">
          <div className="building-toolbar-scroll">
            <span>选房序号：{orderNo}</span>
            <span className="divider">｜</span>
            <span>选房人：{person.name}</span>
            <span className="divider">｜</span>
            <span>可选户型：{availableSizesText}</span>
          </div>
          <div className="building-toolbar-actions">
            <input type="text" value={orderNo} readOnly className="toolbar-input" />
            <span className="toolbar-label">号</span>
            <button className="btn-return-glass" onClick={handleReturn}>
              <IconArrowLeft />
              返回
            </button>
          </div>
        </div>
      </div>

      {/* Floating Left Panel */}
      <aside className="building-sidebar-glass glass-panel">
        <h3 className="sidebar-block">{blockName}</h3>
        <div className="sidebar-metrics">
          <span className="metrics-label">剩余房源</span>
          <span className="metrics-value">{currentRemaining}</span>
          <span className="metrics-unit">套</span>
        </div>
        <div className="sidebar-areas-compact">
          {areaRemaining.map(({ name, total }) => (
            <div key={name} className="area-row">
              <span>{name}</span>
              <span>{total}套</span>
            </div>
          ))}
        </div>
        <div className="sidebar-person-compact">
          <div className="person-row">
            <span className="label">序号</span>
            <span className="value">{orderNo}</span>
          </div>
          <div className="person-row">
            <span className="label">选房人</span>
            <span className="value">{person.name}</span>
          </div>
        </div>
        <div className="round-section">
          <h4>【第{round}轮选房】</h4>
          <div className="unit-summary">
            {requiredCounts.map(({ size }) => (
              <span key={size} className="size-badge">{size}㎡</span>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="building-content">
        {!selectedBuilding ? (
          <div className="aerial-view-full">
            <div className="aerial-map-full">
              {buildings.map((b) => (
                <BuildingMarker
                  key={b.id}
                  building={b}
                  onClick={handleBuildingClick}
                  disabled={isDisabled}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="building-detail glass-panel">
            <div className="building-detail-header">
              <div className="detail-header-left">
                <span className="detail-label">楼盘表</span>
                <h3 className="detail-title">
                  {selectedBuilding.districtName}
                  ({selectedBuilding.district === 'west' ? '李各庄路11号院' : '李各庄路8号院'})：
                  {selectedBuilding.buildingNum || selectedBuilding.label}号楼
                </h3>
              </div>
              <button
                className="btn-close-glass"
                onClick={handleBackToAerial}
                disabled={isDisabled}
                title="返回地图"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="building-detail-main">
              <div className="floor-unit-grid">
                <table className="floor-unit-table">
                  <thead>
                    <tr>
                      <th rowSpan={2} className="floor-col">楼层</th>
                      <th colSpan={2}>2单元</th>
                      <th colSpan={2}>1单元</th>
                    </tr>
                    <tr>
                      <th>西</th>
                      <th>东</th>
                      <th>西</th>
                      <th>东</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floorUnits.map((row) => (
                      <tr key={row.floor}>
                        <td className="floor-col">{row.floor}</td>
                        {['unit2West', 'unit2East', 'unit1West', 'unit1East'].map((key) => {
                          const cell = row[key];
                          const isAvailable = cell && cell.status === 'available' && !isDisabled;
                          const isSelectedCell = selectedUnit && cell && selectedUnit.code === cell.code;
                          return (
                            <td
                              key={key}
                              className={`unit-cell unit-cell--${cell?.status || ''} ${isAvailable ? 'clickable' : ''} ${isSelectedCell ? 'selected' : ''}`}
                              onClick={() => isAvailable && setSelectedUnit(cell)}
                            >
                              {cell?.code || ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="building-info-panel">
                <h4 className="floorplan-title">户型图</h4>
                {selectedPlan ? (
                  <div className="floorplan-single">
                    <span className="floorplan-name">{selectedPlan.name}</span>
                    <div className="floorplan-image-wrap">
                      <img src={selectedPlan.image} alt={selectedPlan.name} />
                    </div>
                  </div>
                ) : (
                  <p className="floorplan-placeholder">请选择房号查看户型图</p>
                )}
              </div>
            </div>
            <div className="building-detail-footer">
              <button
                className="btn-submit-glass"
                onClick={handleSubmit}
                disabled={!selectedUnit || isDisabled}
              >
                提交选中
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Countdown overlay after confirm */}
      <AnimatePresence>
        {isDisabled && countdown !== null && (
          <motion.div
            className="countdown-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="countdown-box-glass"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="countdown-number">{countdown}</div>
              <div className="countdown-unit">秒</div>
              <div className="countdown-text">选房成功，即将返回</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal - Centered, backdrop-blur, flow animation button */}
      <AnimatePresence>
        {showConfirm && selectedBuilding && selectedUnit && (
          <motion.div
            className="confirm-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="confirm-modal-dialog glass-panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-modal-header">
                <h3 className="confirm-title">确认选房</h3>
                <button
                  type="button"
                  className="confirm-modal-close"
                  onClick={() => setShowConfirm(false)}
                  aria-label="关闭"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="confirm-main">
                <div className="confirm-info">
                  {[
                    { label: '选房人', value: person.name },
                    { label: '小区', value: confirmCommunity },
                    { label: '楼号', value: selectedBuilding.buildingNum || selectedBuilding.label },
                    { label: '单元', value: selectedUnit.unit || '1' },
                    { label: '房号', value: selectedUnit.code },
                    { label: '户型', value: `${selectedUnit.size}平方米` },
                    { label: '楼层', value: selectedFloor ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="confirm-row">
                      <span className="label">{label}</span>
                      <span className="value">{value}</span>
                    </div>
                  ))}
                </div>
                {selectedPlan && (
                  <div className="confirm-plan">
                    <img src={selectedPlan.image} alt={selectedPlan.name} />
                  </div>
                )}
              </div>
              <div className="confirm-actions">
                <button
                  className="btn-confirm-flow"
                  onClick={handleConfirmSelection}
                >
                  <span className="btn-confirm-shine" />
                  确认选房
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
