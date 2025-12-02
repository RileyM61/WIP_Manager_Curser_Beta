/**
 * Value Trend Chart - Shows business value over time
 */

import React, { useMemo } from 'react';
import { ValueHistoryRecord } from '../types';
import { formatCurrency } from '../lib/calculations';

interface ValueTrendChartProps {
  history: ValueHistoryRecord[];
}

const ValueTrendChart: React.FC<ValueTrendChartProps> = ({ history }) => {
  // Sort by date ascending and limit to last 12 months
  const chartData = useMemo(() => {
    const sorted = [...history]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-12);

    if (sorted.length === 0) return { points: [], min: 0, max: 0 };

    const values = sorted.map(h => h.businessValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || max * 0.1;

    return {
      points: sorted,
      min: Math.max(0, min - padding),
      max: max + padding,
    };
  }, [history]);

  if (chartData.points.length < 2) {
    return null;
  }

  const { points, min, max } = chartData;
  const range = max - min || 1;

  // Chart dimensions
  const width = 800;
  const height = 300;
  const paddingLeft = 80;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate point positions
  const pointPositions = points.map((point, index) => {
    const x = paddingLeft + (index / (points.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((point.businessValue - min) / range) * chartHeight;
    return { x, y, data: point };
  });

  // Create path for the line
  const linePath = pointPositions
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Create path for the gradient fill
  const areaPath = `${linePath} L ${pointPositions[pointPositions.length - 1].x} ${height - paddingBottom} L ${paddingLeft} ${height - paddingBottom} Z`;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    value: min + range * pct,
    y: paddingTop + chartHeight - pct * chartHeight,
  }));

  // Format month label
  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="valueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={label.y}
              x2={width - paddingRight}
              y2={label.y}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray={i === 0 ? '' : '4 4'}
            />
            <text
              x={paddingLeft - 10}
              y={label.y + 4}
              textAnchor="end"
              className="text-xs fill-slate-500"
            >
              {formatCurrency(label.value, true)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#valueGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {pointPositions.map((point, i) => (
          <g key={i}>
            {/* Outer circle (glow) */}
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="#10b981"
              opacity="0.2"
            />
            {/* Inner circle */}
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#10b981"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* X-axis label */}
            {(i === 0 || i === points.length - 1 || points.length <= 6 || i % 2 === 0) && (
              <text
                x={point.x}
                y={height - paddingBottom + 20}
                textAnchor="middle"
                className="text-xs fill-slate-500"
              >
                {formatMonth(point.data.recordedAt)}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Hover tooltip would go here in a more complex implementation */}
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Business Value</span>
        </div>
      </div>
    </div>
  );
};

export default ValueTrendChart;

