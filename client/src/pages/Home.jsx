import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
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

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const projectName = 'xx项目';
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

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

  // 基于选房记录 mock 数据的可视化统计
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
  const todayTotal = rowsToday.length; // 当日总选房数

  // 日同比：与前一日比较
  const yesterdayStr =
    historyDays.length > 1 ? historyDays[historyDays.length - 2] : null;
  const rowsYesterday = yesterdayStr
    ? allRows.filter((r) => r.selectDate === yesterdayStr)
    : [];
  const yesterdayTotal = rowsYesterday.length;
  const dayChange =
    yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : null;

  // 不同维度的已选/未选统计（视为任一轮为“已选”）
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
      {
        label: '第一轮',
        selected: firstSelected,
        unselected: firstTotal - firstSelected,
      },
      {
        label: '第二轮',
        selected: secondSelected,
        unselected: secondTotal - secondSelected,
      },
    ];
  }, [allRows]);

  // 各村当日卡片数据，只取 Top3（按当日选房数降序）
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

        const max = Math.max(...series, 1);
        const n = series.length;
        const sparkPoints = series
          .map((v, idx) => {
            const x = n === 1 ? 0 : (idx / (n - 1)) * 100;
            const y = 40 - (v / max) * 30;
            return `${x},${y}`;
          })
          .join(' ');

        return { name, today, change, sparkData: series };
      });
      return all.sort((a, b) => b.today - a.today).slice(0, 3);
    },
    [allVillages, allRows, historyDays],
  );

  // 各村排行榜（按总选房数降序）
  const villageRanking = useMemo(
    () =>
      villageStats
        .slice()
        .sort((a, b) => b.selected + b.unselected - (a.selected + a.unselected)),
    [villageStats],
  );

  return (
    <div className={`home-layout ${headerCollapsed && !timerActive ? 'home-header-collapsed' : ''}`}>
      {timerActive ? (
        <div className="home-header-slot home-header-slot--timer">
          <GlobalSelectionTimerBar />
        </div>
      ) : (
        <header className="home-header">
          <button
            type="button"
            className="header-toggle"
            onClick={() => setHeaderCollapsed((v) => !v)}
            aria-label={headerCollapsed ? '展开标题栏' : '折叠标题栏'}
          >
            {headerCollapsed ? (
              <svg className="toggle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12L12 18L18 12" />
                <path d="M6 6L12 12L18 6" />
              </svg>
            ) : (
              <svg className="toggle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12L12 6L18 12" />
                <path d="M6 18L12 12L18 18" />
              </svg>
            )}
          </button>
          <h1 className="home-header-title">大地集团{projectName}智能选房系统</h1>
          <div className="home-header-right">
            <div className="header-meta">
              <span className="header-weather">{weatherText}</span>
              <span className="header-date">{dateInfo.dateText}</span>
              <span className="header-week">{dateInfo.weekText}</span>
            </div>
            <button
              className="btn-logout"
              title="退出登录"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 16l4-4-4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 12H10"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>
      )}

      <nav className="home-menu">
        {headerCollapsed && (
          <button
            type="button"
            className="menu-expand-trigger"
            onClick={() => setHeaderCollapsed(false)}
            aria-label="展开标题栏"
            title="展开标题栏"
          >
            <svg className="toggle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 12L12 18L18 12" />
              <path d="M6 6L12 12L18 6" />
            </svg>
          </button>
        )}
        <button
          className={`menu-item menu-item-icon ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
          title="首页"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 11L12 3l9 8v9h-6v-6H9v6H3z" />
          </svg>
        </button>
        <button
          className={`menu-item menu-item-icon ${isHouseSelection ? 'active' : ''}`}
          onClick={() => navigate('/house-selection')}
          title="智能选房"
        >
          <IconHouseSelection />
          智能选房
        </button>
        <button
          className={`menu-item menu-item-icon ${isAnnotate ? 'active' : ''}`}
          onClick={() => navigate('/annotate')}
          title="坐标标注"
        >
          <IconMapPin />
          坐标标注
        </button>
        <button className="menu-item menu-item-icon" title="销控管理">
          <IconChart />
          销控管理
        </button>
      </nav>

      <main
          className={`home-main ${showDashboard ? 'home-main-dashboard' : ''} ${
            isBuildingPage || isAnnotate ? 'home-main-fullscreen' : ''
          }`}
        >
        {showDashboard ? (
          <div className="dashboard">
            <div className="dashboard-header">
              <h2 className="dashboard-title">选房数据概览</h2>
              <p className="dashboard-tagline">万家灯火，温暖归家 — 每一套房，点亮一个家庭的幸福</p>
            </div>
            <div className="dashboard-grid">
              <section className="chart-card kpi-card kpi-card-primary">
                <div className="kpi-card-glow" />
                <div className="kpi-card-inner">
                  <div className="kpi-header">
                    <span className="kpi-icon kpi-icon-home">🏠</span>
                    当日选房数
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-value">{todayTotal}</span>
                    <span className="kpi-unit">套</span>
                  </div>
                  <div className="kpi-footer">
                    <div className="kpi-change">
                      <span className="kpi-change-label">日同比</span>
                      {dayChange == null ? (
                        <span className="kpi-change-value kpi-change-neutral">—</span>
                      ) : (
                        <span
                          className={`kpi-change-value ${
                            dayChange >= 0 ? 'kpi-change-up' : 'kpi-change-down'
                          }`}
                        >
                          {dayChange >= 0 ? '▲' : '▼'}
                          {Math.abs(dayChange).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="kpi-sparkline">
                      <SparklineChart data={historyDailyTotal} color="#f59e0b" height={52} />
                    </div>
                  </div>
                </div>
              </section>
              {villageCards.map((card, idx) => (
                <section key={card.name} className="chart-card kpi-card">
                  <div className="kpi-card-inner">
                    <div className="kpi-header">
                      <span className={`kpi-icon kpi-icon-village kpi-icon-v${idx + 1}`}>
                        {['📍', '🏘️', '🏡'][idx]}
                      </span>
                      {card.name} 当日选房数
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">{card.today}</span>
                      <span className="kpi-unit">套</span>
                    </div>
                    <div className="kpi-footer">
                      <div className="kpi-change">
                        <span className="kpi-change-label">日同比</span>
                        {card.change == null ? (
                          <span className="kpi-change-value kpi-change-neutral">—</span>
                        ) : (
                          <span
                            className={`kpi-change-value ${
                              card.change >= 0 ? 'kpi-change-up' : 'kpi-change-down'
                            }`}
                          >
                            {card.change >= 0 ? '▲' : '▼'}
                            {Math.abs(card.change).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="kpi-sparkline">
                        <SparklineChart
                          data={card.sparkData}
                          color={['#f59e0b', '#eab308', '#d97706'][idx]}
                          height={52}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              ))}
              <section className="chart-card dashboard-left chart-card-echarts">
                <div className="chart-title">历史总选房数</div>
                <HistoryBarChart days={historyDays} values={historyDailyTotal} />
              </section>
              <section className="chart-card dashboard-right chart-card-echarts">
                <div className="chart-title">各村排行榜</div>
                <VillageRankingChart data={villageRanking} />
              </section>
              <section className="chart-card dashboard-left chart-card-echarts">
                <div className="chart-title">不同户型 · 已选 / 未选套数</div>
                <StackedBarChart data={typeStats} />
              </section>
              <section className="chart-card dashboard-right chart-card-echarts">
                <div className="chart-title">各轮次 · 已选 / 未选套数</div>
                <StackedBarChart data={roundStats} colors={['#eab308', '#334155']} />
              </section>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
