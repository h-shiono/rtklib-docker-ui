import { useRef, useEffect, useCallback } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import type { ENUEpoch } from './types';
import { Q_COLORS } from './types';

interface Plot2DViewProps {
  data: ENUEpoch[];
  height: number;
}

const PADDING = { top: 10, right: 10, bottom: 30, left: 50 };

export function Plot2DView({ data, height }: Plot2DViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ref: containerRef, width: containerWidth } = useElementSize();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // Use the smaller of width/height to make a square plot
  const size = Math.min(containerWidth, height);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0 || size < 100) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Colors based on theme
    const textColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const bgColor = isDark ? '#1a1b1e' : '#ffffff';
    const axisColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Compute E/N bounds
    let minE = Infinity, maxE = -Infinity;
    let minN = Infinity, maxN = -Infinity;
    for (const epoch of data) {
      if (epoch.e < minE) minE = epoch.e;
      if (epoch.e > maxE) maxE = epoch.e;
      if (epoch.n < minN) minN = epoch.n;
      if (epoch.n > maxN) maxN = epoch.n;
    }

    // Add 10% padding to bounds
    const rangeE = maxE - minE || 1;
    const rangeN = maxN - minN || 1;
    const padFrac = 0.1;
    minE -= rangeE * padFrac;
    maxE += rangeE * padFrac;
    minN -= rangeN * padFrac;
    maxN += rangeN * padFrac;

    // Square plot area — equal aspect ratio guaranteed
    const plotW = size - PADDING.left - PADDING.right;
    const plotH = size - PADDING.top - PADDING.bottom;
    const scaleE = plotW / (maxE - minE);
    const scaleN = plotH / (maxN - minN);
    const scale = Math.min(scaleE, scaleN);

    // Recenter after aspect ratio adjustment
    const actualRangeE = plotW / scale;
    const actualRangeN = plotH / scale;
    const centerE = (minE + maxE) / 2;
    const centerN = (minN + maxN) / 2;
    minE = centerE - actualRangeE / 2;
    maxE = centerE + actualRangeE / 2;
    minN = centerN - actualRangeN / 2;
    maxN = centerN + actualRangeN / 2;

    // Coordinate transform functions
    const toX = (e: number) => PADDING.left + ((e - minE) / (maxE - minE)) * plotW;
    const toY = (n: number) => PADDING.top + plotH - ((n - minN) / (maxN - minN)) * plotH;

    // Draw grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const gridCount = 5;

    ctx.font = '10px monospace';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    // Vertical grid (E axis)
    for (let i = 0; i <= gridCount; i++) {
      const val = minE + ((maxE - minE) * i) / gridCount;
      const x = toX(val);
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, PADDING.top + plotH);
      ctx.stroke();
      ctx.fillText(formatAxisValue(val), x, size - 5);
    }

    // Horizontal grid (N axis)
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridCount; i++) {
      const val = minN + ((maxN - minN) * i) / gridCount;
      const y = toY(val);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + plotW, y);
      ctx.stroke();
      ctx.fillText(formatAxisValue(val), PADDING.left - 4, y + 3);
    }

    // Draw plot border
    ctx.strokeStyle = axisColor;
    ctx.strokeRect(PADDING.left, PADDING.top, plotW, plotH);

    // Draw origin crosshair (reference point at 0,0)
    if (minE <= 0 && maxE >= 0 && minN <= 0 && maxN >= 0) {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
      ctx.setLineDash([4, 4]);
      const ox = toX(0);
      const oy = toY(0);
      ctx.beginPath();
      ctx.moveTo(ox, PADDING.top);
      ctx.lineTo(ox, PADDING.top + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PADDING.left, oy);
      ctx.lineTo(PADDING.left + plotW, oy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw data points
    for (const epoch of data) {
      const x = toX(epoch.e);
      const y = toY(epoch.n);
      ctx.fillStyle = Q_COLORS[epoch.Q] || '#888';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axis labels
    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('East (m)', PADDING.left + plotW / 2, size - 1);

    ctx.save();
    ctx.translate(12, PADDING.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('North (m)', 0, 0);
    ctx.restore();
  }, [data, size, isDark]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div ref={containerRef} style={{ width: '100%', height, display: 'flex', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}

/** Format axis values: use meters with appropriate precision */
function formatAxisValue(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 100) return val.toFixed(0);
  if (abs >= 1) return val.toFixed(1);
  return val.toFixed(3);
}
