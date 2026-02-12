import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api/client';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const projectName = 'xx项目';

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data)).catch(() => setStats(null));
  }, []);

  const isHouseSelection = location.pathname.includes('house-selection');
  const isAnnotate = location.pathname === '/annotate';
  const isBuildingPage = location.pathname.includes('/building');
  const showDashboard = location.pathname === '/' || location.pathname === '';

  return (
    <div className="home-layout">
      <header className="home-header">
        <h1>大地集团{projectName}智能选房系统</h1>
        <button className="btn-logout" onClick={() => { logout(); navigate('/login'); }}>
          退出
        </button>
      </header>

      <nav className="home-menu">
        <button
          className={`menu-item ${isHouseSelection ? 'active' : ''}`}
          onClick={() => navigate('/house-selection')}
        >
          智能选房
        </button>
        <button
          className={`menu-item ${isAnnotate ? 'active' : ''}`}
          onClick={() => navigate('/annotate')}
        >
          坐标标注
        </button>
        <button className="menu-item">销控管理</button>
      </nav>

      <main className={`home-main ${isBuildingPage || isAnnotate ? 'home-main-fullscreen' : ''}`}>
        {showDashboard ? (
          <div className="dashboard">
            <h2 className="dashboard-title">数据概览</h2>
            <div className="dashboard-cards">
              <div className="stat-card">
                <span className="stat-label">当前日期</span>
                <span className="stat-value">{stats?.date ?? '--'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">当日选房</span>
                <span className="stat-value highlight">{stats?.todaySelected ?? '--'} 套</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">待交付总套数</span>
                <span className="stat-value">{stats?.pendingDelivery ?? '--'} 套</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">累计选房</span>
                <span className="stat-value">{stats?.totalSelected ?? '--'} 套</span>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
