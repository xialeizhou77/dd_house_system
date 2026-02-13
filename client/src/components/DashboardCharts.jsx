import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const GOLD = '#D4AF37';
const GOLD_RGBA = (alpha) => `rgba(212, 175, 55, ${alpha})`;
const MINT = '#34D399';
const MINT_RGBA = (alpha) => `rgba(52, 211, 153, ${alpha})`;
const SLATE_800 = 'rgba(30, 41, 59, 0.9)';

const colorToRgba = (hex, alpha) => {
  if (!hex || !hex.startsWith('#')) return GOLD_RGBA(alpha);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** KPI Sparkline Chart - Smooth line, area fill, no axes */
export function SparklineChart({ data, color = GOLD, height = 48 }) {
  const option = useMemo(
    () => ({
      grid: { top: 4, right: 4, bottom: 4, left: 4 },
      xAxis: { type: 'category', show: false, data: data?.map((_, i) => i) ?? [] },
      yAxis: { type: 'value', show: false, scale: true },
      series: [
        {
          type: 'line',
          data: data ?? [],
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: colorToRgba(color, 0.4) },
                { offset: 0.6, color: colorToRgba(color, 0.12) },
                { offset: 1, color: colorToRgba(color, 0.02) },
              ],
            },
          },
        },
      ],
    }),
    [data, color],
  );
  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%', minWidth: 80 }}
      opts={{ renderer: 'canvas' }}
      notMerge
      lazyUpdate
    />
  );
}

/** History Bar Chart - No grid, rounded bars, semi-transparent gold, hover highlight */
export function HistoryBarChart({ days, values }) {
  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        backgroundColor: SLATE_800,
        borderColor: GOLD_RGBA(0.4),
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
      },
      grid: { top: 24, right: 16, bottom: 40, left: 40 },
      xAxis: {
        type: 'category',
        data: days?.map((d) => d.slice(5)) ?? [],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: values ?? [],
          barWidth: '60%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 1,
              x2: 0,
              y2: 0,
              colorStops: [
                { offset: 0, color: GOLD_RGBA(0.35) },
                { offset: 0.5, color: GOLD_RGBA(0.65) },
                { offset: 1, color: GOLD_RGBA(0.85) },
              ],
            },
            borderRadius: [8, 8, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: GOLD_RGBA(0.95),
              shadowBlur: 12,
              shadowColor: GOLD_RGBA(0.5),
            },
          },
        },
      ],
    }),
    [days, values],
  );
  return (
    <ReactECharts
      option={option}
      style={{ height: 180, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
      lazyUpdate
    />
  );
}

/** Village Ranking - Horizontal bar, no grid, rounded bars, semi-transparent, hover highlight */
export function VillageRankingChart({ data }) {
  const labels = data?.map((d) => d.label) ?? [];
  const values = data?.map((d) => d.selected + d.unselected) ?? [];
  const maxVal = Math.max(...values, 1);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const idx = params[0]?.dataIndex ?? 0;
          return `${labels[idx]}: ${values[idx]} 套`;
        },
        backgroundColor: SLATE_800,
        borderColor: GOLD_RGBA(0.4),
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
      },
      grid: { top: 12, right: 60, bottom: 12, left: 52 },
      xAxis: {
        type: 'value',
        max: maxVal,
        show: false,
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: labels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#94A3B8',
          fontSize: 12,
          fontWeight: 500,
        },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: {
              color:
                i === 0
                  ? GOLD_RGBA(0.75)
                  : i === 1
                    ? 'rgba(148, 163, 184, 0.6)'
                    : i === 2
                      ? GOLD_RGBA(0.5)
                      : 'rgba(100, 116, 139, 0.5)',
            },
          })),
          barWidth: '62%',
          barMaxWidth: 14,
          itemStyle: { borderRadius: [0, 6, 6, 0] },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: 'rgba(212, 175, 55, 0.3)',
            },
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c} 套',
            color: '#CBD5E1',
            fontSize: 11,
            fontWeight: 600,
          },
        },
      ],
    }),
    [labels, values, maxVal],
  );
  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(220, labels.length * 28), width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
      lazyUpdate
    />
  );
}

/** Stacked Bar Chart - Rounded bars, semi-transparent brand colors, no grid */
export function StackedBarChart({ data, colors = [GOLD_RGBA(0.8), 'rgba(30, 41, 59, 0.9)'] }) {
  const labels = data?.map((d) => d.label) ?? [];
  const selected = data?.map((d) => d.selected) ?? [];
  const unselected = data?.map((d) => d.unselected) ?? [];
  const total = data?.map((d) => d.selected + d.unselected) ?? [];

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const idx = params[0]?.dataIndex ?? 0;
          return `${labels[idx]}: 已选 ${selected[idx]} / 未选 ${unselected[idx]}`;
        },
        backgroundColor: SLATE_800,
        borderColor: GOLD_RGBA(0.4),
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
      },
      grid: { top: 12, right: 70, bottom: 12, left: 52 },
      xAxis: {
        type: 'value',
        show: false,
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: labels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 12, fontWeight: 500 },
        splitLine: { show: false },
      },
      series: [
        {
          name: '已选',
          type: 'bar',
          stack: 'total',
          data: selected,
          itemStyle: {
            color: colors[0],
            borderRadius: [0, 6, 6, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: GOLD_RGBA(0.4),
            },
          },
        },
        {
          name: '未选',
          type: 'bar',
          stack: 'total',
          data: unselected,
          itemStyle: {
            color: colors[1],
            borderRadius: [6, 0, 0, 6],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 6,
              shadowColor: 'rgba(148, 163, 184, 0.2)',
            },
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params) => `${selected[params.dataIndex]}/${total[params.dataIndex]}`,
            color: '#CBD5E1',
            fontSize: 11,
            fontWeight: 600,
          },
        },
      ],
      legend: { show: false },
    }),
    [labels, selected, unselected, colors],
  );

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(140, labels.length * 36), width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
      lazyUpdate
    />
  );
}
