import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Code, ScrollArea, Group, ActionIcon, Text, Tabs } from '@mantine/core';
import { IconTrash, IconCopy, IconRefresh, IconTerminal2, IconFileText, IconBug } from '@tabler/icons-react';
import { FilePreview } from './FilePreview';
import type { ProcessStatus } from './StatusIndicator';

interface TabbedTerminalOutputProps {
  logLines: string[];
  maxHeight?: number;
  onClearLog?: () => void;
  outputFilePath: string;
  traceEnabled: boolean;
  processStatus: ProcessStatus;
}

export function TabbedTerminalOutput({
  logLines,
  maxHeight = 400,
  onClearLog,
  outputFilePath,
  traceEnabled,
  processStatus,
}: TabbedTerminalOutputProps) {
  const [activeTab, setActiveTab] = useState<string | null>('console');
  const [refreshKey, setRefreshKey] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef(processStatus);

  // Auto-scroll console to bottom when new lines arrive
  useEffect(() => {
    if (activeTab === 'console' && viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logLines, activeTab]);

  // Auto-refresh previews when processing completes
  useEffect(() => {
    if (prevStatusRef.current === 'running' && processStatus === 'success') {
      setRefreshKey((k) => k + 1);
    }
    prevStatusRef.current = processStatus;
  }, [processStatus]);

  const handleCopyLog = useCallback(() => {
    navigator.clipboard.writeText(logLines.join('\n'));
  }, [logLines]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const traceFilePath = outputFilePath ? `${outputFilePath}.trace` : null;

  // Content height = maxHeight minus header (~36px) minus tabs (~34px)
  const contentHeight = maxHeight - 70;

  return (
    <Box
      style={{
        backgroundColor: 'var(--mantine-color-dark-8)',
        borderRadius: 'var(--mantine-radius-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Terminal Header - macOS Title Bar */}
      <Group
        justify="space-between"
        px="sm"
        py="xs"
        style={{
          backgroundColor: 'var(--mantine-color-dark-7)',
          borderBottom: '1px solid var(--mantine-color-dark-6)',
        }}
      >
        <Group gap="xs">
          <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#ff5f57' }} />
          <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#febc2e' }} />
          <Box w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#28c840' }} />
        </Group>
        <Group gap="xs">
          {activeTab === 'console' ? (
            <>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={handleCopyLog}
                title="Copy to clipboard"
              >
                <IconCopy size={14} />
              </ActionIcon>
              {onClearLog && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={onClearLog}
                  title="Clear terminal"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              )}
            </>
          ) : (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={handleRefresh}
              title="Refresh"
            >
              <IconRefresh size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        keepMounted={false}
        styles={{
          list: {
            backgroundColor: 'var(--mantine-color-dark-7)',
            borderBottom: '1px solid var(--mantine-color-dark-6)',
          },
          tab: {
            fontSize: '11px',
            padding: '4px 10px',
            color: 'var(--mantine-color-gray-5)',
            '&[dataActive]': {
              color: 'var(--mantine-color-gray-1)',
            },
          },
        }}
      >
        <Tabs.List px="sm">
          <Tabs.Tab value="console" leftSection={<IconTerminal2 size={13} />}>
            Console
          </Tabs.Tab>
          <Tabs.Tab value="result" leftSection={<IconFileText size={13} />}>
            Result
          </Tabs.Tab>
          <Tabs.Tab value="trace" leftSection={<IconBug size={13} />}>
            Trace
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="console">
          <ScrollArea h={contentHeight} viewportRef={viewportRef} p="sm">
            {logLines.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic" ff="monospace">
                Waiting for output...
              </Text>
            ) : (
              <Code
                block
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--mantine-color-green-4)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  lineHeight: 1.6,
                }}
              >
                {logLines.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </Code>
            )}
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="result">
          <FilePreview
            filePath={outputFilePath}
            maxHeight={contentHeight}
            refreshKey={refreshKey}
          />
        </Tabs.Panel>

        <Tabs.Panel value="trace">
          <FilePreview
            filePath={traceFilePath}
            maxHeight={contentHeight}
            refreshKey={refreshKey}
            disabledMessage={
              !traceEnabled
                ? 'Trace output is disabled. Set Debug Trace level > 0 in the Output tab.'
                : undefined
            }
          />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
