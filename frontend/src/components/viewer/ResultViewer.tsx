import { useState, useEffect, useMemo } from 'react';
import { Stack, Group, Badge, Text, Loader, SegmentedControl, Select } from '@mantine/core';
import { readFile } from '../../api/files';
import { parsePosFile } from './posParser';
import { MapView } from './MapView';
import { ChartView } from './ChartView';
import type { PosEpoch, ChartMetric } from './types';
import { Q_COLORS, Q_LABELS } from './types';

interface ResultViewerProps {
  filePath: string | null;
  maxHeight: number;
  refreshKey?: number;
}

const METRIC_OPTIONS = [
  { value: 'height', label: 'Height' },
  { value: 'sdn', label: 'Std N' },
  { value: 'sde', label: 'Std E' },
  { value: 'sdu', label: 'Std U' },
];

export function ResultViewer({
  filePath,
  maxHeight,
  refreshKey = 0,
}: ResultViewerProps) {
  const [data, setData] = useState<PosEpoch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'chart'>('map');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('height');

  useEffect(() => {
    if (!filePath) {
      setData([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    readFile(filePath, 50000)
      .then((res) => {
        if (cancelled) return;
        const parsed = parsePosFile(res.content);
        setData(parsed);
        if (parsed.length === 0) {
          setError('No position data found in file');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setData([]);
        setError(err instanceof Error ? err.message : 'Failed to load file');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filePath, refreshKey]);

  // Compute Q-flag statistics
  const qStats = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const epoch of data) {
      counts[epoch.Q] = (counts[epoch.Q] || 0) + 1;
    }
    return counts;
  }, [data]);

  // Layout heights
  const controlBarHeight = 32;
  const legendHeight = 28;
  const vizHeight = maxHeight - controlBarHeight - legendHeight;

  if (!filePath) {
    return (
      <Stack align="center" justify="center" h={maxHeight} gap="xs">
        <Text size="sm" c="dimmed" fs="italic" ff="monospace">
          No result file to display
        </Text>
      </Stack>
    );
  }

  if (loading) {
    return (
      <Stack align="center" justify="center" h={maxHeight} gap="xs">
        <Loader size="sm" color="gray" />
        <Text size="xs" c="dimmed">Loading position data...</Text>
      </Stack>
    );
  }

  if (error && data.length === 0) {
    return (
      <Stack align="center" justify="center" h={maxHeight} gap="xs">
        <Text size="sm" c="dimmed" fs="italic" ff="monospace">
          {error}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={0} h={maxHeight}>
      {/* Control bar */}
      <Group
        justify="space-between"
        px="sm"
        py={4}
        style={{ height: controlBarHeight, flexShrink: 0 }}
      >
        <SegmentedControl
          size="xs"
          value={viewMode}
          onChange={(v) => setViewMode(v as 'map' | 'chart')}
          data={[
            { label: 'Map', value: 'map' },
            { label: 'Chart', value: 'chart' },
          ]}
        />
        <Group gap="xs">
          {viewMode === 'chart' && (
            <Select
              size="xs"
              value={chartMetric}
              onChange={(v) => v && setChartMetric(v as ChartMetric)}
              data={METRIC_OPTIONS}
              w={100}
              styles={{ input: { fontSize: '11px' } }}
            />
          )}
          <Badge size="xs" variant="light" color="gray">
            {data.length.toLocaleString()} epochs
          </Badge>
        </Group>
      </Group>

      {/* Visualization area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {viewMode === 'map' ? (
          <MapView data={data} height={vizHeight} />
        ) : (
          <ChartView data={data} height={vizHeight} metric={chartMetric} />
        )}
      </div>

      {/* Q-flag legend */}
      <Group gap="xs" px="sm" py={2} style={{ height: legendHeight, flexShrink: 0 }}>
        {Object.entries(qStats)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([q, count]) => (
            <Badge
              key={q}
              size="xs"
              variant="dot"
              color="gray"
              styles={{
                root: {
                  '--badge-dot-color': Q_COLORS[Number(q)] || '#888',
                },
              }}
            >
              {Q_LABELS[Number(q)] || `Q${q}`}: {count}
            </Badge>
          ))}
      </Group>
    </Stack>
  );
}
