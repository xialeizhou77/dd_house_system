import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { IconArrowLeft } from '../components/Icons';
import { useSelectionData } from '../contexts/SelectionDataContext';
import { useSelectionTimer } from '../contexts/SelectionTimerContext';
import '../styles/AerialMap.css';
import './BuildingPage.css';

const UNITS_PER_BUILDING = 44;

function getHeatmapColor(selected, unselected) {
  const total = selected + unselected || 1;
  const ratio = selected / total;
  if (ratio <= 0) return { r: 34, g: 197, b: 94 };
  if (ratio >= 1) return { r: 239, g: 68, b: 68 };
  const r = Math.round(34 + (239 - 34) * ratio);
  const g = Math.round(197 - (197 - 68) * ratio);
  const b = Math.round(94 + (68 - 94) * ratio);
  return { r, g, b };
}

const PROJECT_TITLE = '密云区水库防灾减灾及蓄水能力提升项目农宅腾退安置选房';

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

// 楼栋楼层单元数据 - 11层 2单元 东西户（mock 数据）
// 使用简单规则填满楼盘表：绿色为可选户型（available），红色为已选（sold，不可点击）
function generateFloorUnits() {
  const units = [];

  const createCell = (floor, code, sizeHint, unit) => {
    const hash = floor * 10 + parseInt(code.slice(-1), 10);
    const status = hash % 3 === 0 ? 'sold' : 'available';
    return {
      code,
      size: sizeHint,
      status, // 'available' | 'sold'
      unit,
    };
  };

  for (let floor = 1; floor <= 11; floor++) {
    const unit2West = createCell(floor, `${floor}01`, 80, 2);
    const unit2East = createCell(floor, `${floor}02`, 100, 2);
    const unit1West = createCell(floor, `${floor}03`, 100, 1);
    const unit1East = createCell(floor, `${floor}04`, 120, 1);

    units.push({
      floor,
      unit2West,
      unit2East,
      unit1West,
      unit1East,
    });
  }
  return units;
}

// mock 户型图数据（请按需替换为真实图片）
const FLOORPLAN_BY_SIZE = {
  80: { area: 80, name: '80㎡ 两居', image: '/floorplans/80m2.png' },
  100: { area: 100, name: '100㎡ 三居', image: '/floorplans/100m2.png' },
  120: { area: 120, name: '120㎡ 三居', image: '/floorplans/120m2.png' },
};

export default function BuildingPage({ round = 1 }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { rows, setRows } = useSelectionData();
  const { finishTimer } = useSelectionTimer();
  const person = state?.person;
  const [rawCoords, setRawCoords] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(null);

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
  const requiredCounts = availableSizes.map(s => ({ size: s, count: 1 }));
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
    <div className={`building-page ${isDisabled ? 'building-page--disabled' : ''}`}>
      <header className="building-header">
        <h1 className="building-title">{PROJECT_TITLE}</h1>
      </header>

      <div className="building-main">
        <aside className="building-sidebar">
          <h3 className="sidebar-block">{blockName}</h3>
          <div className="sidebar-total">
            <span className="label">总剩余房源</span>
            <span className="value">{selectedBuilding ? buildings.find(b => b.id === selectedBuilding.id)?.remaining || 0 : totalRemaining}套</span>
          </div>
          <div className="sidebar-areas">
            <span className="label">各区剩余房源</span>
            <div className="sidebar-area-list">
              {areaRemaining.map(({ name, total }) => (
                <div key={name} className="sidebar-area-row">
                  <span className="area-name">{name}</span>
                  <span className="area-value">{total}套</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sidebar-person">
              <div className="sidebar-row">
                <span className="label">选房序号:</span>
                <span className="value">{orderNo}</span>
              </div>
              <div className="sidebar-row">
                <span className="label">选房人:</span>
                <span className="value">{person.name}</span>
              </div>
            </div>
          <div className="round-section">
            <h4>【第{round}轮选房】</h4>
            <table className="unit-table">
              <thead>
                <tr>
                  <th>应选户型</th>
                  <th>套数</th>
                </tr>
              </thead>
              <tbody>
                {requiredCounts.map(({ size, count }) => (
                  <tr key={size}>
                    <td>{size}平方米</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="unit-table">
              <thead>
                <tr>
                  <th>已选户型</th>
                  <th>套数</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2}>{selectedUnit ? '已选' : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </aside>

        <div className="building-content">
          {!selectedBuilding ? (
            <>
              <div className="aerial-toolbar aerial-toolbar-shared">
                <div className="aerial-user-scroll">
                  <div className="aerial-user-scroll-text">
                    选房序号：{orderNo}
                    <span className="divider">｜</span>
                    选房人：{person.name}
                    <span className="divider">｜</span>
                    可选户型：{availableSizesText}
                  </div>
                </div>
                <div className="aerial-search">
                  <input type="text" value={orderNo} readOnly className="search-input" />
                  <span className="search-label">号</span>
                  <button className="btn-return btn-return-icon" onClick={handleReturn}>
                  <IconArrowLeft />
                  返回
                </button>
                </div>
              </div>
              <div className="aerial-view aerial-map-area">
                <div className="aerial-map aerial-map-container aerial-map-container--flex">
                  {buildings.map((b) => {
                    const selected = b.selected ?? 0;
                    const unselected = b.unselected ?? UNITS_PER_BUILDING;
                    const rgb = getHeatmapColor(selected, unselected);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className="aerial-building aerial-building-heatmap"
                        style={{
                          left: b.left,
                          top: b.top,
                          '--heatmap-r': rgb.r,
                          '--heatmap-g': rgb.g,
                          '--heatmap-b': rgb.b,
                        }}
                        onClick={() => handleBuildingClick(b)}
                        disabled={isDisabled}
                        title={`${b.districtName}${b.buildingNum}号楼 已选${selected} 未选${unselected}`}
                      >
                        <span className="aerial-building-label">{b.districtName === '西区' ? `西${b.label}` : `东${b.label}`}</span>
                        <span className="aerial-building-stats">{selected}/{unselected}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="building-detail">
              <div className="building-detail-header">
                <div className="detail-header-left">
                  <span className="detail-label">楼盘表</span>
                  <h3 className="detail-title">{selectedBuilding.districtName}({selectedBuilding.district === 'west' ? '李各庄路11号院' : '李各庄路8号院'})地块: {selectedBuilding.buildingNum || selectedBuilding.label}号楼</h3>
                </div>
                <button
                  className="btn-close-top"
                  onClick={handleBackToAerial}
                  disabled={isDisabled}
                  title="关闭"
                  aria-label="关闭"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="building-detail-main">
                <div className="floor-unit-grid">
                  <table className="floor-unit-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="floor-col">楼层\单元</th>
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
                            const className = [
                              'unit-cell',
                              cell ? `unit-cell--${cell.status}` : '',
                              isAvailable ? 'clickable' : '',
                              isSelectedCell ? 'selected' : '',
                            ].filter(Boolean).join(' ');
                            return (
                              <td
                                key={key}
                                className={className}
                                onClick={() => {
                                  if (isAvailable) setSelectedUnit(cell);
                                }}
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
                  <div className="floorplan-panel">
                    <h4 className="floorplan-title">户型图</h4>
                    {selectedPlan ? (
                      <div className="floorplan-single">
                        <div className="floorplan-meta">
                          <span className="floorplan-name">{selectedPlan.name}</span>
                        </div>
                        <div className="floorplan-image-wrap floorplan-image-wrap--large">
                          <img src={selectedPlan.image} alt={selectedPlan.name} />
                        </div>
                      </div>
                    ) : (
                      <p className="floorplan-placeholder">请在左侧选择一个房号查看对应户型图</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="building-detail-footer">
                <button
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={!selectedUnit || isDisabled}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  提交选中
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {isDisabled && countdown !== null && (
        <div className="countdown-overlay">
          <div className="countdown-box">
            <div className="countdown-number">{countdown}</div>
            <div className="countdown-unit">秒</div>
            <div className="countdown-text">选房成功，将自动返回智能选房</div>
          </div>
        </div>
      )}
      {showConfirm && selectedBuilding && selectedUnit && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3 className="confirm-title">确认选房</h3>
              <button
                type="button"
                className="confirm-modal-close"
                onClick={() => setShowConfirm(false)}
                title="关闭"
                aria-label="关闭"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="confirm-main">
              <div className="confirm-info">
                <div className="confirm-row">
                  <span className="label">选房人</span>
                  <span className="value">{person.name}</span>
                </div>
                <div className="confirm-row">
                  <span className="label">房屋权利人</span>
                  <span className="value">—</span>
                </div>
                <div className="confirm-row">
                  <span className="label">小区</span>
                  <span className="value">{confirmCommunity}</span>
                </div>
                <div className="confirm-row">
                  <span className="label">楼号</span>
                  <span className="value">{selectedBuilding.buildingNum || selectedBuilding.label}</span>
                </div>
                <div className="confirm-row">
                  <span className="label">单元号</span>
                  <span className="value">{selectedUnit.unit || '1'}</span>
                </div>
                <div className="confirm-row">
                  <span className="label">房号</span>
                  <span className="value">{selectedUnit.code}</span>
                </div>
                <div className="confirm-row">
                  <span className="label">户型</span>
                  <span className="value">{selectedUnit.size}平方米</span>
                </div>
                <div className="confirm-row">
                  <span className="label">选房协议面积</span>
                  <span className="value">—</span>
                </div>
                <div className="confirm-row">
                  <span className="label">总楼层</span>
                  <span className="value">11</span>
                </div>
                <div className="confirm-row">
                  <span className="label">所在层</span>
                  <span className="value">{selectedFloor ?? '—'}</span>
                </div>
              </div>
              <div className="confirm-plan">
                {selectedPlan && (
                  <div className="confirm-plan-wrap">
                    <img src={selectedPlan.image} alt={selectedPlan.name} />
                  </div>
                )}
              </div>
            </div>
            <div className="confirm-actions">
              <button
                className="btn-confirm"
                onClick={handleConfirmSelection}
              >
                确认选房
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
