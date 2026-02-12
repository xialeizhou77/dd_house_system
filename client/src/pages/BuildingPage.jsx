import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import '../styles/AerialMap.css';
import './BuildingPage.css';

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

function enrichCoords(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((b, i) => {
    const parsed = parseUniqueId(b.id, b.zone, b.label);
    return {
      ...b,
      ...parsed,
      remaining: [44, 44, 22, 38, 32, 66, 44, 44, 18, 44, 28, 36][i % 12] || 40,
    };
  });
}

// 楼栋楼层单元数据 - 11层 2单元 东西户
function generateFloorUnits() {
  const units = [];
  for (let floor = 1; floor <= 11; floor++) {
    const unit1East = `${floor}01`;
    units.push({
      floor,
      unit2West: null,
      unit2East: null,
      unit1West: null,
      unit1East,
    });
  }
  return units;
}

export default function BuildingPage({ round = 1 }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const person = state?.person;
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const loadCoords = useCallback(async () => {
    try {
      const { data } = await api.get('/building-coords');
      setBuildings(enrichCoords(data));
    } catch {
      setBuildings([]);
    }
  }, []);

  useEffect(() => {
    loadCoords();
  }, [loadCoords]);

  if (!person) {
    navigate(`/house-selection/round${round}/start`, { replace: true });
    return null;
  }

  const orderNo = person.orderNo || person.id || '0000';
  const availableSizes = state?.availableSizes || [87, 80];
  const requiredCounts = availableSizes.map(s => ({ size: s, count: 1 }));
  const blockName = 'A块';
  const totalRemaining = 372;

  function handleReturn() {
    navigate(`/house-selection/round${round}/start`);
  }

  function handleBuildingClick(building) {
    console.log('Building clicked:', { id: building.id, zone: building.zone, label: building.label });
    setSelectedBuilding(building);
    setSelectedUnit(null);
  }

  function handleBackToAerial() {
    setSelectedBuilding(null);
    setSelectedUnit(null);
  }

  const floorUnits = selectedBuilding ? generateFloorUnits() : [];

  return (
    <div className="building-page">
      <header className="building-header">
        <h1 className="building-title">{PROJECT_TITLE}</h1>
        <button className="btn-end">结束选</button>
      </header>

      <div className="building-main">
        <aside className="building-sidebar">
          <h3 className="sidebar-block">{blockName}</h3>
          <div className="sidebar-total">
            <span className="label">总剩余房源</span>
            <span className="value">{selectedBuilding ? buildings.find(b => b.id === selectedBuilding.id)?.remaining || 0 : totalRemaining}套</span>
          </div>
          <div className="sidebar-nav">
            <span>&gt;&gt;&gt;</span>
          </div>
          <div className="sidebar-person">
            <div className="sidebar-row">
              <span className="label">选房序号:</span>
              <span className="value">{orderNo}</span>
            </div>
            <div className="sidebar-row">
              <span className="label">被拆迁人:</span>
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
                <button className="btn-back-block">返回地块</button>
                <div className="aerial-search">
                  <input type="text" value={orderNo} readOnly className="search-input" />
                  <span className="search-label">号</span>
                  <button className="btn-return" onClick={handleReturn}>Q返回</button>
                </div>
              </div>
              <div className="aerial-view aerial-map-area">
                <div className="aerial-map aerial-map-container aerial-map-container--flex">
                  {buildings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`aerial-building aerial-building--${b.zone.toLowerCase()}`}
                      style={{
                        left: b.left,
                        top: b.top,
                      }}
                      onClick={() => handleBuildingClick(b)}
                      title={`${b.districtName}${b.buildingNum}号楼 剩余${b.remaining}套`}
                    >
                      {b.districtName === '西区' ? `西${b.label}` : `东${b.label}`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="building-detail">
              <div className="building-detail-header">
                <span className="detail-label">楼盘表</span>
                <h3 className="detail-title">{selectedBuilding.districtName}({selectedBuilding.district === 'west' ? '李各庄路11号院' : '李各庄路8号院'})地块: {selectedBuilding.buildingNum || selectedBuilding.label}号楼</h3>
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
                          <td className={selectedUnit === `2西${row.floor}` ? 'selected' : ''}>{row.unit2West || ''}</td>
                          <td className={selectedUnit === `2东${row.floor}` ? 'selected' : ''}>{row.unit2East || ''}</td>
                          <td className={selectedUnit === `1西${row.floor}` ? 'selected' : ''}>{row.unit1West || ''}</td>
                          <td
                            className={`unit-cell ${selectedUnit === row.unit1East ? 'selected' : ''} ${row.unit1East ? 'clickable' : ''}`}
                            onClick={() => row.unit1East && setSelectedUnit(row.unit1East)}
                          >
                            {row.unit1East || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="building-info-panel">
                  <div className="info-row">
                    <span className="info-label">选房序号:</span>
                    <span className="info-value">{orderNo}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">被拆迁人:</span>
                    <span className="info-value">{person.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">所选户型:</span>
                    <span className="info-value">{selectedUnit ? `${selectedUnit}室` : '户型名称'}</span>
                  </div>
                </div>
              </div>
              <div className="building-detail-footer">
                <button className="btn-reselect" onClick={handleBackToAerial}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                  </svg>
                  重新选楼
                </button>
                <button className="btn-return-top" onClick={handleReturn}>Q返回</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
