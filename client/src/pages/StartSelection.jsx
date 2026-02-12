import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './StartSelection.css';

function HouseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

export default function StartSelection({ round = 1 }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [person, setPerson] = useState(null);
  const [houses, setHouses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleQuery() {
    if (!code.trim()) return;
    setError('');
    setPerson(null);
    setLoading(true);
    try {
      const { data } = await api.get(`/house/person/${encodeURIComponent(code.trim())}`);
      setPerson(data);
      if (data.status === '未选房') {
        const { data: list } = await api.get('/house/houses/available');
        setHouses(list);
      } else {
        setHouses([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || '查询失败');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setCode('');
    setPerson(null);
    setError('');
  }

  function handleStartSelection() {
    if (!person || person.status === '已选房') return;
    const sizes = houses.length > 0
      ? [...new Set(houses.map(h => h.area))].sort((a, b) => a - b)
      : [];
    navigate(`/house-selection/round${round}/building`, {
      state: { person, availableSizes: sizes },
    });
  }

  const availableSizes = person?.status === '未选房' && houses.length > 0
    ? [...new Set(houses.map(h => h.area))].sort((a, b) => a - b)
    : [];

  return (
    <div className="start-selection">
      <h3 className="page-title">第{round}轮选房 - 开始选房</h3>

      <div className="query-section">
        <div className="query-input-group">
          <label>输入编号</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="请输入选房序号/身份证/手机号"
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
        </div>
        <button className="btn-query" onClick={handleQuery} disabled={loading}>
          {loading ? '查询中...' : '查询'}
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
                <span className="query-info-label">被腾退人:</span>
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
                disabled={person.status === '已选房'}
              >
                <HouseIcon />
                开始选房
              </button>
              <button className="btn-re-query" onClick={handleReset}>
                <SearchIcon />
                重新查询
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
