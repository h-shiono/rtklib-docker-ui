import { useEffect, useRef, useMemo } from 'react';
import { useElementSize } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { PosEpoch, ChartMetric } from './types';
import { Q_COLORS } from './types';

interface ChartViewProps {
  data: PosEpoch[];
  height: number;
  metric: ChartMetric;
}

const METRIC_LABELS: Record<ChartMetric, string> = {
  height: 'Height (m)',
  sdn: 'Std Dev North (m)',
  sde: 'Std Dev East (m)',
  sdu: 'Std Dev Up (m)',
};

/** uPlot plugin to draw Q-flag colored points */
function qColorPlugin(qValues: number[]): uPlot.Plugin {
  return {
    hooks: {
      drawSeries: (u: uPlot, seriesIdx: number) => {
        if (seriesIdx !== 1) return; // Only draw for the data series
        const ctx = u.ctx;
        const xData = u.data[0];
        const yData = u.data[seriesIdx];

        ctx.save();
        for (let i = 0; i < xData.length; i++) {
          const x = u.valToPos(xData[i], 'x', true);
          const y = u.valToPos(yData[i] as number, 'y', true);
          if (x < 0 || y < 0) continue;

          const q = qValues[i] ?? 5;
          ctx.fillStyle = Q_COLORS[q] || '#888';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      },
    },
  };
}

export function ChartView({ data, height, metric }: ChartViewProps) {
  const { ref: containerRef, width } = useElementSize();
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // Prepare uPlot data arrays
  const plotData = useMemo(() => {
    if (data.length === 0) return null;
    const xValues = new Float64Array(data.length);
    const yValues = new Float64Array(data.length);
    const qValues: number[] = [];

    for (let i = 0; i < data.length; i++) {
      xValues[i] = data[i].timeUnix;
      yValues[i] = data[i][metric];
      qValues.push(data[i].Q);
    }

    return { xValues, yValues, qValues };
  }, [data, metric]);

  // Create/destroy uPlot instance
  useEffect(() => {
    if (!chartRef.current || !plotData || width < 100) return;

    const axisColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
    const textColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)';
    const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

    const opts: uPlot.Options = {
      width,
      height: height - 8, // small padding
      plugins: [qColorPlugin(plotData.qValues)],
      cursor: {
        drag: { x: true, y: true },
      },
      scales: {
        x: { time: true },
      },
      axes: [
        {
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: axisColor },
          font: '10px monospace',
          values: (_u: uPlot, vals: number[]) =>
            vals.map((v) => {
              const d = new Date(v * 1000);
              return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
            }),
        },
        {
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: axisColor },
          font: '10px monospace',
          label: METRIC_LABELS[metric],
          labelFont: '11px sans-serif',
          size: 60,
        },
      ],
      series: [
        {},
        {
          // Hide the default line/points — we draw custom colored points via plugin
          stroke: 'transparent',
          points: { show: false },
        },
      ],
    };

    const uplotData: uPlot.AlignedData = [
      Array.from(plotData.xValues),
      Array.from(plotData.yValues),
    ];

    // Destroy previous instance
    if (uplotRef.current) {
      uplotRef.current.destroy();
    }

    uplotRef.current = new uPlot(opts, uplotData, chartRef.current);

    return () => {
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [plotData, width, height, isDark, metric]);

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      <div ref={chartRef} />
    </div>
  );
}
