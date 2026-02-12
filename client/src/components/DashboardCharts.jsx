import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const colorToRgba = (hex, alpha) => {
  if (!hex || !hex.startsWith('#')) return `rgba(245, 158, 11, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** KPI 卡片内嵌的迷你折线图（Sparkline） */
export function SparklineChart({ data, color = '#f59e0b', height = 48 }) {
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
                { offset: 0, color: colorToRgba(color, 0.35) },
                { offset: 1, color: colorToRgba(color, 0.03) },
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

/** 历史选房柱状图 - 黑色系 */
export function HistoryBarChart({ days, values }) {
  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        textStyle: { color: '#f8fafc' },
      },
      grid: { top: 24, right: 16, bottom: 40, left: 40 },
      xAxis: {
        type: 'category',
        data: days?.map((d) => d.slice(5)) ?? [],
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.35)', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: values ?? [],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 1,
              x2: 0,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#1e293b' },
                { offset: 0.5, color: '#334155' },
                { offset: 1, color: '#f59e0b' },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(245, 158, 11, 0.5)' } },
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

/** 各村排行榜 - 横向柱状图 黑色系 */
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
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        textStyle: { color: '#f8fafc' },
      },
      grid: { top: 12, right: 60, bottom: 12, left: 52 },
      xAxis: {
        type: 'value',
        max: maxVal,
        show: false,
      },
      yAxis: {
        type: 'category',
        data: labels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 12,
          fontWeight: 500,
        },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: {
              color:
                i < 3
                  ? ['#f59e0b', '#94a3b8', '#b45309'][i]
                  : {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 1,
                      y2: 0,
                      colorStops: [
                        { offset: 0, color: '#334155' },
                        { offset: 1, color: '#64748b' },
                      ],
                    },
            },
          })),
          barWidth: '60%',
          barMaxWidth: 14,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            formatter: '{c} 套',
            color: '#cbd5e1',
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

/** 已选/未选堆叠条形图 - 黑色系 */
export function StackedBarChart({ data, colors = ['#f59e0b', '#334155'] }) {
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
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        textStyle: { color: '#f8fafc' },
      },
      grid: { top: 12, right: 70, bottom: 12, left: 52 },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category',
        data: labels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 500 },
      },
      series: [
        {
          name: '已选',
          type: 'bar',
          stack: 'total',
          data: selected,
          itemStyle: {
            color: colors[0],
            borderRadius: [0, 4, 4, 0],
          },
        },
        {
          name: '未选',
          type: 'bar',
          stack: 'total',
          data: unselected,
          itemStyle: {
            color: colors[1],
            borderRadius: [4, 0, 0, 4],
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params) => `${selected[params.dataIndex]}/${total[params.dataIndex]}`,
            color: '#cbd5e1',
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
