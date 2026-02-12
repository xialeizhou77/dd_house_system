import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { IconArrowLeft, IconCheck } from '../components/Icons';
import '../styles/AerialMap.css';
import './AnnotatePage.css';

export default function AnnotatePage() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingZone, setPendingZone] = useState('West');
  const [message, setMessage] = useState('');

  function toUniqueId(item) {
    if (item.id && (item.id.startsWith('西区_') || item.id.startsWith('东区_'))) return item.id;
    const zone = item.zone === 'West' ? '西区' : '东区';
    return `${zone}_${item.label}`;
  }

  const loadCoords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/building-coords');
      const list = Array.isArray(data) ? data : [];
      setCoords(list.map((c) => ({ ...c, id: toUniqueId(c) })));
    } catch {
      setCoords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoords();
  }, [loadCoords]);

  function handleMapClick(e) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPending({ left: `${x.toFixed(2)}%`, top: `${y.toFixed(2)}%` });
    setPendingLabel('');
    setPendingZone('West');
    setMessage('');
  }

  function handleConfirmAdd() {
    const label = pendingLabel.trim();
    if (!label) {
      setMessage('请填写楼号');
      return;
    }
    const zone = pendingZone || 'West';
    const id = zone === 'West' ? `西区_${label}` : `东区_${label}`;
    const newItem = {
      id,
      label,
      zone,
      top: pending.top,
      left: pending.left,
    };
    setCoords((prev) => [...prev.filter((c) => c.id !== id), newItem].sort(sortCoords));
    setPending(null);
    setPendingLabel('');
    setPendingZone('West');
    setMessage('');
  }

  function handleRemove(id) {
    setCoords((prev) => prev.filter((c) => c.id !== id));
  }

  function sortCoords(a, b) {
    const zoneOrder = a.zone === 'West' && b.zone === 'East' ? -1 : a.zone === 'East' && b.zone === 'West' ? 1 : 0;
    if (zoneOrder !== 0) return zoneOrder;
    return parseInt(a.label, 10) - parseInt(b.label, 10);
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      await api.post('/building-coords', coords);
      setMessage('已保存到配置文件 buildingCoords.json');
    } catch (err) {
      setMessage(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="annotate-page">
      <header className="annotate-header">
        <h1>楼号坐标标注</h1>
      </header>

      <div className="annotate-main">
        <aside className="annotate-sidebar">
          <p className="sidebar-hint">点击底图上的位置，再填写楼号与区域，即可添加/更新该楼栋坐标。</p>
          <div className="coord-list">
            <h3>当前标注 ({coords.length})</h3>
            {loading ? (
              <p>加载中...</p>
            ) : (
              <ul>
                {coords.sort(sortCoords).map((c) => (
                  <li key={c.id}>
                    <span className="coord-item">{c.id}</span>
                    <span className="coord-pos">{c.left}, {c.top}</span>
                    <button type="button" className="btn-remove" onClick={() => handleRemove(c.id)} title="删除">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {message && <p className="annotate-message">{message}</p>}
        </aside>

        <div className="annotate-map-wrap annotate-content-right">
          <div className="aerial-toolbar aerial-toolbar-shared">
            <button type="button" className="btn-back btn-with-icon" onClick={() => navigate(-1)}>
              <IconArrowLeft />
              返回
            </button>
            <button type="button" className="btn-save btn-with-icon" onClick={handleSave} disabled={saving}>
              <IconCheck />
              {saving ? '保存中...' : '保存到配置文件'}
            </button>
          </div>
          <div className="aerial-map-area">
            <div
              className="annotate-map aerial-map-container aerial-map-container--flex"
              onClick={handleMapClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleMapClick(e)}
              aria-label="点击选择楼栋位置"
            >
              {coords.map((b) => (
                <span
                  key={b.id}
                  className={`annotate-pin annotate-pin--${b.zone.toLowerCase()}`}
                  style={{ left: b.left, top: b.top }}
                  title={b.id}
                >
                  {b.zone === 'West' ? `西${b.label}` : `东${b.label}`}
                </span>
              ))}
              {pending && (
                <span className="annotate-pin annotate-pin--pending" style={{ left: pending.left, top: pending.top }}>
                  ?
                </span>
              )}
            </div>
          </div>
        </div>

        {pending && (
          <div className="annotate-modal">
            <div className="annotate-form">
              <h3>添加楼号</h3>
              <p className="form-pos">位置: left {pending.left}, top {pending.top}</p>
              <div className="form-row">
                <label>楼号</label>
                <input
                  type="text"
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value)}
                  placeholder="如 1, 2, 3"
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmAdd()}
                />
              </div>
              <div className="form-row">
                <label>区域</label>
                <select value={pendingZone} onChange={(e) => setPendingZone(e.target.value)}>
                  <option value="West">西区 (李各庄路11号院)</option>
                  <option value="East">东区 (李各庄路8号院)</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setPending(null); setPendingLabel(''); }}>
                  取消
                </button>
                <button type="button" className="btn-confirm btn-with-icon" onClick={handleConfirmAdd}>
                  <IconCheck />
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
