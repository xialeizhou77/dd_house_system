import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSelectionTimer } from '../contexts/SelectionTimerContext';
import api from '../api/client';
import GlobalSelectionTimerBar from '../components/GlobalSelectionTimerBar';
import { IconHouseSelection, IconMapPin, IconChart } from '../components/Icons';
import {
  SparklineChart,
  HistoryBarChart,
  VillageRankingChart,
  StackedBarChart,
} from '../components/DashboardCharts';
import { selectionData } from '../mock/selectionData';
import './Home.css';

/** Gold Logo Icon */
function IconLogoGold() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="logo-icon">
      <defs>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5C76B" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8962E" />
        </linearGradient>
      </defs>
      <path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke="url(#logoGold)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline points="9 22 9 12 15 12 15 22" stroke="url(#logoGold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems = [
  { path: '/', label: '首页', icon: HomeIcon },
  { path: '/house-selection', label: '智能选房', icon: IconHouseSelection },
  { path: '/annotate', label: '坐标标注', icon: IconMapPin },
  { path: '#', label: '销控管理', icon: IconChart },
];

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 11L12 3l9 8v9h-6v-6H9v6H3z" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const projectName = 'xx项目';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data)).catch(() => setStats(null));
  }, []);

  const isHouseSelection = location.pathname.includes('house-selection');
  const isAnnotate = location.pathname === '/annotate';
  const isBuildingPage = location.pathname.includes('/building');
  const showDashboard = location.pathname === '/' || location.pathname === '';

  const dateInfo = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    const w = weeks[now.getDay()];
    return {
      dateText: `${y}年${m}月${d}日`,
      weekText: `星期${w}`,
    };
  }, []);

  const weatherText = '晴 26℃';

  const allRows = selectionData;
  const allVillages = Array.from(new Set(allRows.map((r) => r.village)));

  const historyDays = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.selectDate))).sort(),
    [allRows],
  );
  const historyDailyTotal = historyDays.map(
    (d) => allRows.filter((r) => r.selectDate === d).length,
  );

  const todayStr = historyDays[historyDays.length - 1];
  const rowsToday = allRows.filter((r) => r.selectDate === todayStr);
  const todayTotal = rowsToday.length;

  const yesterdayStr =
    historyDays.length > 1 ? historyDays[historyDays.length - 2] : null;
  const rowsYesterday = yesterdayStr
    ? allRows.filter((r) => r.selectDate === yesterdayStr)
    : [];
  const yesterdayTotal = rowsYesterday.length;
  const dayChange =
    yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : null;

  const isSelected = (row) =>
    row.firstRound === '已选' || row.secondRound === '已选';

  const typeStats = useMemo(() => {
    const sizes = Array.from(new Set(allRows.map((r) => r.finalArea))).sort();
    return sizes.map((size) => {
      const rows = allRows.filter((r) => r.finalArea === size);
      const selected = rows.filter(isSelected).length;
      const total = rows.length;
      const unselected = total - selected;
      return { label: size, selected, unselected };
    });
  }, [allRows]);

  const villageStats = useMemo(
    () =>
      allVillages.map((name) => {
        const rows = allRows.filter((r) => r.village === name);
        const selected = rows.filter(isSelected).length;
        const total = rows.length;
        const unselected = total - selected;
        return { label: name, selected, unselected };
      }),
    [allRows, allVillages],
  );

  const { status: timerStatus } = useSelectionTimer();
  const timerActive = timerStatus === 'running' || timerStatus === 'locked';

  const roundStats = useMemo(() => {
    const firstSelected = allRows.filter((r) => r.firstRound === '已选').length;
    const firstTotal = allRows.length;
    const secondSelected = allRows.filter(
      (r) => r.secondRound === '已选',
    ).length;
    const secondTotal = allRows.length;
    return [
      { label: '第一轮', selected: firstSelected, unselected: firstTotal - firstSelected },
      { label: '第二轮', selected: secondSelected, unselected: secondTotal - secondSelected },
    ];
  }, [allRows]);

  const villageCards = useMemo(
    () => {
      const all = allVillages.map((name) => {
        const series = historyDays.map(
          (d) =>
            allRows.filter(
              (r) => r.selectDate === d && r.village === name,
            ).length,
        );
        const today = series[series.length - 1] ?? 0;
        const yesterday = series.length > 1 ? series[series.length - 2] : 0;
        const change =
          yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : null;
        return { name, today, change, sparkData: series };
      });
      return all.sort((a, b) => b.today - a.today).slice(0, 3);
    },
    [allVillages, allRows, historyDays],
  );

  const villageRanking = useMemo(
    () =>
      villageStats
        .slice()
        .sort((a, b) => b.selected + b.unselected - (a.selected + a.unselected)),
    [villageStats],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 0) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: i * 0.05 },
    }),
    exit: { opacity: 0 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div className={`home-layout ${timerActive ? 'layout-with-timer' : ''}`}>
      {/* Timer bar slot - full width when active */}
      {timerActive && (
        <div className="home-header-slot home-header-slot--timer">
          <GlobalSelectionTimerBar />
        </div>
      )}

      <div className="home-layout-body">
      {/* Floating Glass Sidebar */}
      <aside
        className={`home-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}
      >
        <div className="sidebar-inner card-frosted">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
          >
            {sidebarOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 17l-5-5 5-5" />
                <path d="M18 17l-5-5 5-5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 17l5-5-5-5" />
                <path d="M6 17l5-5-5-5" />
              </svg>
            )}
          </button>

          <div className="sidebar-logo">
            <IconLogoGold />
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="sidebar-logo-text"
              >
                大地{projectName}
              </motion.span>
            )}
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path) && item.path !== '#';
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.path}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => item.path !== '#' && navigate(item.path)}
                  disabled={item.path === '#'}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="sidebar-nav-icon">
                    <Icon />
                  </span>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="sidebar-nav-label"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="sidebar-nav-indicator"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            {sidebarOpen && (
              <div className="sidebar-meta">
                <span className="sidebar-weather">{weatherText}</span>
                <span className="sidebar-date">{dateInfo.dateText}</span>
                <span className="sidebar-week">{dateInfo.weekText}</span>
              </div>
            )}
            <motion.button
              className="sidebar-logout btn-secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="退出登录"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 16l4-4-4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 12H10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {sidebarOpen && <span>退出</span>}
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`home-main ${showDashboard ? 'home-main-dashboard' : ''} ${
          isHouseSelection && !isBuildingPage ? 'home-main-themed' : ''
        } ${isBuildingPage || isAnnotate ? 'home-main-fullscreen' : ''}`}
      >
        {showDashboard ? (
          <motion.div
            className="dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="dashboard-header" variants={itemVariants}>
              <h2 className="dashboard-title">选房数据概览</h2>
              <p className="dashboard-tagline">万家灯火，温暖归家 — 每一套房，点亮一个家庭的幸福</p>
            </motion.div>

            <div className="dashboard-bento">
              {/* Bento KPI Cards */}
              <motion.section
                className="bento-card bento-kpi bento-kpi-primary"
                variants={itemVariants}
              >
                <div className="bento-kpi-glow" />
                <div className="bento-kpi-inner">
                  <div className="bento-kpi-header">
                    <span className="bento-kpi-icon">🏠</span>
                    当日选房数
                  </div>
                  <div className="bento-kpi-value-wrap">
                    <span className="bento-kpi-value bento-kpi-value-gold">{todayTotal}</span>
                    <span className="bento-kpi-unit">套</span>
                  </div>
                  <div className="bento-kpi-footer">
                    <div className="bento-kpi-change">
                      <span className="bento-kpi-change-label">日同比</span>
                      {dayChange == null ? (
                        <span className="bento-kpi-change-value neutral">—</span>
                      ) : (
                        <span className={`bento-kpi-change-value ${dayChange >= 0 ? 'up' : 'down'}`}>
                          {dayChange >= 0 ? '▲' : '▼'}{Math.abs(dayChange).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="bento-kpi-chart">
                      <SparklineChart data={historyDailyTotal} color="#D4AF37" height={52} />
                    </div>
                  </div>
                </div>
              </motion.section>

              {villageCards.map((card, idx) => (
                <motion.section
                  key={card.name}
                  className="bento-card bento-kpi"
                  variants={itemVariants}
                >
                  <div className="bento-kpi-inner">
                    <div className="bento-kpi-header">
                      <span className="bento-kpi-icon">{['📍', '🏘️', '🏡'][idx]}</span>
                      {card.name} 当日
                    </div>
                    <div className="bento-kpi-value-wrap">
                      <span className="bento-kpi-value bento-kpi-value-gold">{card.today}</span>
                      <span className="bento-kpi-unit">套</span>
                    </div>
                    <div className="bento-kpi-footer">
                      <div className="bento-kpi-change">
                        <span className="bento-kpi-change-label">日同比</span>
                        {card.change == null ? (
                          <span className="bento-kpi-change-value neutral">—</span>
                        ) : (
                          <span className={`bento-kpi-change-value ${card.change >= 0 ? 'up' : 'down'}`}>
                            {card.change >= 0 ? '▲' : '▼'}{Math.abs(card.change).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="bento-kpi-chart">
                        <SparklineChart
                          data={card.sparkData}
                          color={['#D4AF37', '#E5C76B', '#B8962E'][idx]}
                          height={52}
                        />
                      </div>
                    </div>
                  </div>
                </motion.section>
              ))}

              {/* Chart Cards */}
              <motion.section
                className="bento-card bento-chart"
                variants={itemVariants}
              >
                <div className="bento-chart-title">历史总选房数</div>
                <HistoryBarChart days={historyDays} values={historyDailyTotal} />
              </motion.section>

              <motion.section
                className="bento-card bento-chart"
                variants={itemVariants}
              >
                <div className="bento-chart-title">各村排行榜</div>
                <VillageRankingChart data={villageRanking} />
              </motion.section>

              <motion.section
                className="bento-card bento-chart"
                variants={itemVariants}
              >
                <div className="bento-chart-title">不同户型 · 已选 / 未选套数</div>
                <StackedBarChart data={typeStats} />
              </motion.section>

              <motion.section
                className="bento-card bento-chart"
                variants={itemVariants}
              >
                <div className="bento-chart-title">各轮次 · 已选 / 未选套数</div>
                <StackedBarChart data={roundStats} colors={['rgba(212,175,55,0.8)', 'rgba(30,41,59,0.9)']} />
              </motion.section>
            </div>
          </motion.div>
        ) : (
          <Outlet />
        )}
      </main>
      </div>
    </div>
  );
}
