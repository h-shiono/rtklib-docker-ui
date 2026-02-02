import { useState, useEffect, useCallback } from 'react';
import {
  AppShell,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
  ActionIcon,
  Badge,
  Checkbox,
  Divider,
  Code,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconSatellite,
  IconPlayerPlay,
  IconPlayerStop,
  IconFile,
  IconFolderOpen,
  IconRefresh,
  IconDownload,
  IconPlugConnected,
  IconPlugConnectedX,
  IconTestPipe,
  IconInfoCircle,
} from '@tabler/icons-react';
import { TerminalOutput, StatusIndicator, ConfigLoader, StreamConfiguration } from './components';
import type { ProcessStatus } from './components';
import { useWebSocket } from './hooks';
import type { LogMessage } from './hooks';
import * as str2strApi from './api/str2str';

function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle color scheme"
    >
      {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}

function PostProcessingPanel() {
  const [roverFile, setRoverFile] = useState('/workspace/rover.obs');
  const [baseFile, setBaseFile] = useState('/workspace/base.obs');
  const [navFile, setNavFile] = useState('/workspace/nav.nav');
  const [outputFile, setOutputFile] = useState('/workspace/output.pos');
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [useBase, setUseBase] = useState(true);

  // Sample log data for demo (rnx2rtkp not yet implemented with WebSocket)
  const sampleLogLines = [
    '2026/01/01 12:00:00 RTKLIB started',
    '2026/01/01 12:00:01 Loading configuration...',
    '2026/01/01 12:00:02 Configuration loaded successfully',
    '2026/01/01 12:00:03 Opening input files...',
    `2026/01/01 12:00:04 Rover: ${roverFile}`,
    `2026/01/01 12:00:05 Base:  ${baseFile}`,
    `2026/01/01 12:00:06 Nav:   ${navFile}`,
    '2026/01/01 12:00:07 Processing epoch 1/1000...',
  ];

  const handleStart = () => {
    setProcessStatus('running');
    setLogLines([]);

    // Simulate processing (TODO: Replace with real API call)
    let index = 0;
    const interval = setInterval(() => {
      if (index < sampleLogLines.length) {
        setLogLines((prev) => [...prev, sampleLogLines[index]]);
        index++;
      } else {
        setLogLines((prev) => [...prev, '2026/01/01 12:00:15 Processing completed successfully']);
        setProcessStatus('success');
        clearInterval(interval);
      }
    }, 500);
  };

  const handleStop = () => {
    setProcessStatus('idle');
    setLogLines((prev) => [...prev, '2026/01/01 12:00:10 Process stopped by user']);
  };

  const handleConfigLoad = (config: Record<string, unknown>) => {
    console.log('Config loaded:', config);
  };

  return (
    <Grid gutter="md">
      {/* Left Pane: Configuration & Control */}
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Stack gap="md" h="100%">
          <ConfigLoader onConfigLoad={handleConfigLoad} />

          <Card withBorder style={{ flex: 1 }}>
            <Stack gap="sm">
              <Title order={6}>Input Files</Title>

              <TextInput
                label="Rover Observation"
                placeholder="/workspace/rover.obs"
                value={roverFile}
                onChange={(e) => setRoverFile(e.currentTarget.value)}
                leftSection={<IconFile size={16} />}
                rightSection={
                  <ActionIcon variant="subtle" size="sm">
                    <IconFolderOpen size={16} />
                  </ActionIcon>
                }
              />

              <Checkbox
                label="Use Base Station"
                checked={useBase}
                onChange={(e) => setUseBase(e.currentTarget.checked)}
              />

              {useBase && (
                <TextInput
                  label="Base Observation"
                  placeholder="/workspace/base.obs"
                  value={baseFile}
                  onChange={(e) => setBaseFile(e.currentTarget.value)}
                  leftSection={<IconFile size={16} />}
                  rightSection={
                    <ActionIcon variant="subtle" size="sm">
                      <IconFolderOpen size={16} />
                    </ActionIcon>
                  }
                />
              )}

              <TextInput
                label="Navigation File"
                placeholder="/workspace/nav.nav"
                value={navFile}
                onChange={(e) => setNavFile(e.currentTarget.value)}
                leftSection={<IconFile size={16} />}
                rightSection={
                  <ActionIcon variant="subtle" size="sm">
                    <IconFolderOpen size={16} />
                  </ActionIcon>
                }
              />

              <Divider my="xs" />

              <TextInput
                label="Output File"
                placeholder="/workspace/output.pos"
                value={outputFile}
                onChange={(e) => setOutputFile(e.currentTarget.value)}
                leftSection={<IconFile size={16} />}
              />
            </Stack>
          </Card>

          {/* Action Area */}
          <Card withBorder>
            <Group grow>
              {processStatus === 'running' ? (
                <Button
                  color="red"
                  leftSection={<IconPlayerStop size={18} />}
                  onClick={handleStop}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  color="green"
                  leftSection={<IconPlayerPlay size={18} />}
                  onClick={handleStart}
                >
                  Execute
                </Button>
              )}
            </Group>
          </Card>
        </Stack>
      </Grid.Col>

      {/* Right Pane: Monitor & Logs */}
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Stack gap="md" h="100%">
          {/* Status Bar */}
          <Card withBorder>
            <Group justify="space-between">
              <StatusIndicator status={processStatus} />
              <Group gap="xs">
                <Badge variant="light" color="blue">
                  rnx2rtkp
                </Badge>
                <ActionIcon variant="subtle" size="sm">
                  <IconRefresh size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>

          {/* Terminal Output */}
          <Card withBorder style={{ flex: 1 }} p={0}>
            <TerminalOutput
              lines={logLines}
              maxHeight={350}
              onClear={() => setLogLines([])}
            />
          </Card>

          {/* Result Card */}
          {processStatus === 'success' && (
            <Card withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={6}>Result</Title>
                  <Badge color="green">Complete</Badge>
                </Group>
                <Group gap="lg">
                  <Box>
                    <Text size="xs" c="dimmed">Output File</Text>
                    <Code>{outputFile}</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Solutions</Text>
                    <Code>1,000 epochs</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Fix Rate</Text>
                    <Code>95.2%</Code>
                  </Box>
                </Group>
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  size="sm"
                >
                  Download Result
                </Button>
              </Stack>
            </Card>
          )}
        </Stack>
      </Grid.Col>
    </Grid>
  );
}

interface StreamServerPanelProps {
  processId: string | null;
  setProcessId: (id: string | null) => void;
  processState: ProcessStatus;
  setProcessState: (state: ProcessStatus) => void;
}

function StreamServerPanel({
  processId,
  setProcessId,
  processState,
  setProcessState,
}: StreamServerPanelProps) {
  const [logLines, setLogLines] = useState<string[]>([]);
  const [currentArgs, setCurrentArgs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection for real-time logs
  const { isConnected, clearMessages } = useWebSocket({
    onMessage: useCallback((message: LogMessage) => {
      if (message.type === 'log' && message.message) {
        setLogLines((prev) => [...prev.slice(-500), message.message!]);
      }
      if (message.type === 'status' && message.status) {
        // Map backend status to UI status
        const statusMap: Record<string, ProcessStatus> = {
          idle: 'idle',
          starting: 'running',
          running: 'running',
          stopping: 'running',
          stopped: 'idle',
          error: 'error',
        };
        setProcessState(statusMap[message.status] || 'idle');
      }
    }, []),
    onConnect: useCallback(() => {
      setLogLines((prev) => [...prev, '[WS] Connected to log stream']);
    }, []),
    onDisconnect: useCallback(() => {
      setLogLines((prev) => [...prev, '[WS] Disconnected from log stream']);
    }, []),
  });

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    setLogLines([]);

    try {
      const result = await str2strApi.startStr2Str({ args: currentArgs });
      setProcessId(result.id);
      setProcessState('running');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start process');
      setProcessState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!processId) return;

    setIsLoading(true);
    setError(null);

    try {
      await str2strApi.stopStr2Str({ process_id: processId });
      setProcessState('idle');
      setProcessId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    setLogLines([]);

    try {
      // Use -h argument to show help
      const result = await str2strApi.startStr2Str({ args: ['-h'] });
      setProcessId(result.id);
      setProcessState('running');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run test');
      setProcessState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setLogLines([]);
    clearMessages();
  };

  return (
    <Grid gutter="md">
      {/* Left Pane: Configuration */}
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Stack gap="md">
          <Card withBorder padding="xs">
            <Group justify="space-between">
              <Text size="sm" fw={600}>WebSocket Status</Text>
              <Group gap="xs">
                <Tooltip label={isConnected ? 'WebSocket connected' : 'WebSocket disconnected'}>
                  {isConnected ? (
                    <IconPlugConnected size={18} color="var(--mantine-color-green-6)" />
                  ) : (
                    <IconPlugConnectedX size={18} color="var(--mantine-color-red-6)" />
                  )}
                </Tooltip>
                <Text size="xs" c={isConnected ? 'green' : 'dimmed'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </Group>
            </Group>
          </Card>

          <StreamConfiguration onArgsChange={setCurrentArgs} />

          {error && (
            <Alert color="red" icon={<IconInfoCircle size={16} />} withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Action Area */}
          <Card withBorder>
            <Stack gap="sm">
              <Group grow>
                {processState === 'running' ? (
                  <Button
                    color="red"
                    leftSection={<IconPlayerStop size={18} />}
                    onClick={handleStop}
                    loading={isLoading}
                  >
                    Stop
                  </Button>
                ) : (
                  <Button
                    color="green"
                    leftSection={<IconPlayerPlay size={18} />}
                    onClick={handleStart}
                    loading={isLoading}
                  >
                    Start Stream
                  </Button>
                )}
              </Group>
              <Button
                variant="light"
                leftSection={<IconTestPipe size={18} />}
                onClick={handleTest}
                loading={isLoading}
                disabled={processState === 'running'}
              >
                Test (Show Help)
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Grid.Col>

      {/* Right Pane: Monitor */}
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Stack gap="md" h="100%">
          {/* Status Bar */}
          <Card withBorder>
            <Group justify="space-between">
              <StatusIndicator status={processState} />
              <Group gap="xs">
                <Badge variant="light" color="blue">
                  str2str
                </Badge>
                {processId && (
                  <Badge variant="outline" size="sm">
                    ID: {processId}
                  </Badge>
                )}
              </Group>
            </Group>
          </Card>

          {/* Terminal Output */}
          <Card withBorder style={{ flex: 1 }} p={0}>
            <TerminalOutput
              lines={logLines}
              maxHeight={400}
              onClear={handleClear}
            />
          </Card>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}

function ConversionPanel() {
  return (
    <Card withBorder>
      <Stack gap="md" align="center" py="xl">
        <IconRefresh size={48} opacity={0.5} />
        <Title order={4} c="dimmed">Data Conversion</Title>
        <Text size="sm" c="dimmed">Convert binary data formats with convbin</Text>
        <Badge>Coming Soon</Badge>
      </Stack>
    </Card>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<string | null>('stream-server');
  const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [rtklibVersion, setRtklibVersion] = useState<string>('');

  // Stream process state (lifted to App level for persistence across tabs)
  const [streamProcessId, setStreamProcessId] = useState<string | null>(null);
  const [streamProcessState, setStreamProcessState] = useState<ProcessStatus>('idle');

  // Global stop handler for stream process
  const handleStopStream = async () => {
    if (!streamProcessId) return;

    try {
      await str2strApi.stopStr2Str({ process_id: streamProcessId });
      setStreamProcessState('idle');
      setStreamProcessId(null);
    } catch (err) {
      console.error('Failed to stop stream:', err);
    }
  };

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus(data.status === 'ok' ? 'ok' : 'error');
      })
      .catch(() => {
        setHealthStatus('error');
      });

    // Get RTKLIB version
    fetch('/api/rtklib/version')
      .then((res) => res.json())
      .then((data) => {
        setRtklibVersion(data.version || 'unknown');
      })
      .catch(() => {
        setRtklibVersion('unavailable');
      });
  }, []);

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          {/* Logo & Title */}
          <Group gap="sm">
            <IconSatellite size={28} />
            <Stack gap={0}>
              <Title order={4} visibleFrom="sm">RTKLIB Web UI</Title>
              {rtklibVersion && (
                <Text size="xs" c="dimmed" visibleFrom="md">{rtklibVersion}</Text>
              )}
            </Stack>
          </Group>

          {/* Tabs - Center */}
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            variant="pills"
            visibleFrom="sm"
          >
            <Tabs.List>
              <Tabs.Tab value="post-processing">Post Processing</Tabs.Tab>
              <Tabs.Tab
                value="stream-server"
                rightSection={
                  streamProcessState === 'running' ? (
                    <Badge color="green" size="xs" circle>
                      1
                    </Badge>
                  ) : null
                }
              >
                Stream Server
              </Tabs.Tab>
              <Tabs.Tab value="conversion">Conversion</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {/* Right Controls */}
          <Group gap="sm">
            {/* Global Stream Process Indicator */}
            {streamProcessState === 'running' && (
              <Group gap="xs">
                <Badge color="green" variant="dot" size="sm">
                  Stream Running
                </Badge>
                <ActionIcon
                  variant="filled"
                  color="red"
                  size="sm"
                  onClick={handleStopStream}
                  title="Stop stream"
                >
                  <IconPlayerStop size={14} />
                </ActionIcon>
              </Group>
            )}
            <Badge
              color={healthStatus === 'ok' ? 'green' : healthStatus === 'error' ? 'red' : 'gray'}
              variant="dot"
              size="lg"
              visibleFrom="sm"
            >
              API: {healthStatus.toUpperCase()}
            </Badge>
            <ColorSchemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {/* Mobile Tabs */}
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          variant="pills"
          hiddenFrom="sm"
          mb="md"
        >
          <Tabs.List grow>
            <Tabs.Tab value="post-processing">Post</Tabs.Tab>
            <Tabs.Tab
              value="stream-server"
              rightSection={
                streamProcessState === 'running' ? (
                  <Badge color="green" size="xs" circle>
                    1
                  </Badge>
                ) : null
              }
            >
              Stream
            </Tabs.Tab>
            <Tabs.Tab value="conversion">Convert</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Tab Content */}
        {activeTab === 'post-processing' && <PostProcessingPanel />}
        {activeTab === 'stream-server' && (
          <StreamServerPanel
            processId={streamProcessId}
            setProcessId={setStreamProcessId}
            processState={streamProcessState}
            setProcessState={setStreamProcessState}
          />
        )}
        {activeTab === 'conversion' && <ConversionPanel />}
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
