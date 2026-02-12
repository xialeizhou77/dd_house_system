import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectionTimer } from '../contexts/SelectionTimerContext';
import { useSelectionData } from '../contexts/SelectionDataContext';
import { IconSearch } from '../components/Icons';
import './StartSelection.css';

function fuzzyMatch(text, query) {
  if (!query.trim()) return false;
  const lower = String(text || '').toLowerCase();
  const q = String(query).toLowerCase().trim();
  return lower.includes(q);
}

function HouseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

export default function StartSelection({ round = 1 }) {
  const navigate = useNavigate();
  const { startTimer, isLocked } = useSelectionTimer();
  const { rows } = useSelectionData();
  const [code, setCode] = useState('');
  const [person, setPerson] = useState(null);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const searchResults = useMemo(() => {
    if (!code.trim()) return [];
    const roundRows = round === 1
      ? rows
      : rows.filter((r) => r.selectionRound === 2);
    return roundRows.filter(
      (r) =>
        fuzzyMatch(r.queryNo, code) ||
        fuzzyMatch(r.name, code) ||
        fuzzyMatch(r.idNumber, code) ||
        fuzzyMatch(r.phone, code),
    ).slice(0, 10);
  }, [rows, code, round]);

  function rowToPerson(row) {
    const statusRound = round === 1 ? row.firstRound : row.secondRound;
    return {
      id: row.id,
      orderNo: row.queryNo,
      name: row.name,
      idNumber: row.idNumber,
      phone: row.phone,
      status: statusRound === '已选' ? '已选房' : '未选房',
    };
  }

  function handleSelectRow(row) {
    setPerson(rowToPerson(row));
    setCode(row.queryNo);
    setShowDropdown(false);
    setError('');
  }

  function handleQuery() {
    if (!code.trim()) return;
    setError('');
    if (searchResults.length === 1) {
      handleSelectRow(searchResults[0]);
    } else if (searchResults.length > 1) {
      setShowDropdown(true);
    } else {
      setPerson(null);
      setError('未找到匹配的候选人');
    }
  }

  function handleReset() {
    setCode('');
    setPerson(null);
    setError('');
    setShowDropdown(false);
  }

  function handleStartSelection() {
    if (!person || person.status === '已选房' || isLocked) return;
    // 开始选房时启动 3 分钟全局倒计时
    startTimer();
    const sizes = [80, 100, 120];
    navigate(`/house-selection/round${round}/building`, {
      state: { person, availableSizes: sizes },
    });
  }

  const availableSizes = person?.status === '未选房' ? [80, 100, 120] : [];

  return (
    <div className="start-selection">
      <h3 className="page-title">第{round}轮选房 - 开始选房</h3>

      <div className="query-section">
        <div className="query-input-group query-input-with-dropdown">
          <label>输入编号</label>
          <div className="input-wrapper">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setShowDropdown(true);
                setPerson(null);
              }}
              onFocus={() => code.trim() && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="请输入选房序号/姓名/身份证/手机号（支持模糊查询）"
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            />
            {showDropdown && searchResults.length > 0 && (
              <ul className="search-dropdown">
                {searchResults.map((row) => (
                  <li
                    key={row.id}
                    className="search-dropdown-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectRow(row);
                    }}
                  >
                    <span className="search-no">{row.queryNo}</span>
                    <span className="search-name">{row.name}</span>
                    <span className="search-meta">{row.village}</span>
                    <span className={`search-status ${round === 1 ? row.firstRound : row.secondRound}`}>
                      {round === 1 ? row.firstRound : row.secondRound}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button className="btn-query btn-query-icon" onClick={handleQuery} disabled={isLocked}>
          <IconSearch />
          查询
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {person && (
        <>
          <div className="query-modal-overlay" />
          <div className="query-modal">
            <h4 className="query-modal-title">【第{round}轮选房】</h4>
            <div className="query-modal-body">
              <div className="query-info-row">
                <span className="query-info-label">选房序号:</span>
                <span className="query-info-value">{person.orderNo || person.id}</span>
              </div>
              <div className="query-info-row">
                <span className="query-info-label">选房人:</span>
                <span className="query-info-value">{person.name}</span>
              </div>
              <div className="query-info-row">
                <span className="query-info-label">身份证号码:</span>
                <span className="query-info-value">{person.idNumber}</span>
              </div>
              <div className="query-info-row query-info-row-last">
                <span className="query-info-label">可选户型:</span>
                <span className="query-info-value">
                  {availableSizes.length > 0
                    ? availableSizes.map((s, i) => (
                        <span key={s}>{i > 0 && '、'}{s}平方米</span>
                      ))
                    : person.status === '已选房' ? '—' : '暂无'}
                </span>
              </div>
            </div>

            <div className="query-modal-actions">
              <button
                className="btn-start-selection"
                onClick={handleStartSelection}
                disabled={person.status === '已选房' || isLocked}
              >
                <HouseIcon />
                开始选房
              </button>
              <button className="btn-re-query" onClick={handleReset}>
                <IconSearch />
                重新查询
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
