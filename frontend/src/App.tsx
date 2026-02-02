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
  SimpleGrid,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconSatellite,
  IconPlayerPlay,
  IconPlayerStop,
  IconFile,
  IconRefresh,
  IconDownload,
  IconPlugConnected,
  IconPlugConnectedX,
  IconTestPipe,
  IconInfoCircle,
} from '@tabler/icons-react';
import { TerminalOutput, StatusIndicator, StreamConfiguration, PostProcessingConfiguration } from './components';
import type { ProcessStatus } from './components';
import { useWebSocket } from './hooks';
import type { LogMessage } from './hooks';
import * as str2strApi from './api/str2str';
import type { Rnx2RtkpConfig } from './types/rnx2rtkpConfig';

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
  const [baseFile, setBaseFile] = useState('');
  const [navFile, setNavFile] = useState('/workspace/nav.nav');
  const [outputFile, setOutputFile] = useState('/workspace/output.pos');
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [useBase, setUseBase] = useState(false);
  const [config, setConfig] = useState<Rnx2RtkpConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!config) {
      setError('Configuration not set');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLogLines([]);
    setProcessStatus('running');

    // TODO: Replace with real API call
    setLogLines((prev) => [...prev, '[INFO] Starting post-processing...']);
    setLogLines((prev) => [...prev, `[INFO] Rover: ${roverFile}`]);
    if (useBase && baseFile) {
      setLogLines((prev) => [...prev, `[INFO] Base: ${baseFile}`]);
    }
    setLogLines((prev) => [...prev, `[INFO] Nav: ${navFile}`]);
    setLogLines((prev) => [...prev, `[INFO] Output: ${outputFile}`]);
    setLogLines((prev) => [...prev, '[INFO] Processing...']);

    setTimeout(() => {
      setLogLines((prev) => [...prev, '[SUCCESS] Processing completed']);
      setProcessStatus('success');
      setIsLoading(false);
    }, 2000);
  };

  const handleStop = () => {
    setProcessStatus('idle');
    setLogLines((prev) => [...prev, '[INFO] Process stopped by user']);
    setIsLoading(false);
  };

  return (
    <Stack gap="xs">
      {/* Section A: Execution Inputs */}
      <Card withBorder p="xs">
        <Stack gap="xs">
          <Title order={6} size="xs">Input Files</Title>

          <SimpleGrid cols={2} spacing="xs">
            <TextInput
              size="xs"
              label="Rover Observation (RINEX OBS)"
              placeholder="/workspace/rover.obs"
              value={roverFile}
              onChange={(e) => setRoverFile(e.currentTarget.value)}
              leftSection={<IconFile size={14} />}
              styles={{ label: { fontSize: '10px' } }}
              required
            />

            <TextInput
              size="xs"
              label="Navigation File (RINEX NAV)"
              placeholder="/workspace/nav.nav"
              value={navFile}
              onChange={(e) => setNavFile(e.currentTarget.value)}
              leftSection={<IconFile size={14} />}
              styles={{ label: { fontSize: '10px' } }}
              required
            />
          </SimpleGrid>

          <Checkbox
            size="xs"
            label="Use Base Station"
            checked={useBase}
            onChange={(e) => setUseBase(e.currentTarget.checked)}
            styles={{ label: { fontSize: '10px' } }}
          />

          {useBase && (
            <TextInput
              size="xs"
              label="Base Observation (RINEX OBS)"
              placeholder="/workspace/base.obs"
              value={baseFile}
              onChange={(e) => setBaseFile(e.currentTarget.value)}
              leftSection={<IconFile size={14} />}
              styles={{ label: { fontSize: '10px' } }}
            />
          )}

          <Divider />

          <TextInput
            size="xs"
            label="Output File"
            placeholder="/workspace/output.pos"
            value={outputFile}
            onChange={(e) => setOutputFile(e.currentTarget.value)}
            leftSection={<IconFile size={14} />}
            styles={{ label: { fontSize: '10px' } }}
            required
          />

          {error && (
            <Alert color="red" icon={<IconInfoCircle size={16} />} p="xs" withCloseButton onClose={() => setError(null)}>
              <Text size="xs">{error}</Text>
            </Alert>
          )}

          <Group grow>
            {processStatus === 'running' ? (
              <Button
                size="xs"
                color="red"
                leftSection={<IconPlayerStop size={14} />}
                onClick={handleStop}
                loading={isLoading}
              >
                Stop
              </Button>
            ) : (
              <Button
                size="xs"
                color="green"
                leftSection={<IconPlayerPlay size={14} />}
                onClick={handleStart}
                loading={isLoading}
              >
                Execute
              </Button>
            )}
          </Group>
        </Stack>
      </Card>

      {/* Section B: Configuration Tabs */}
      <PostProcessingConfiguration onConfigChange={setConfig} />

      {/* Log Console */}
      <Card withBorder p={0}>
        <Stack gap="xs">
          <Card.Section withBorder p="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <StatusIndicator status={processStatus} />
                <Badge variant="light" color="blue" size="sm">
                  rnx2rtkp
                </Badge>
              </Group>
            </Group>
          </Card.Section>
          <TerminalOutput
            lines={logLines}
            maxHeight={250}
            onClear={() => setLogLines([])}
          />
        </Stack>
      </Card>

      {/* Result Card */}
      {processStatus === 'success' && (
        <Card withBorder p="xs">
          <Stack gap="xs">
            <Group justify="space-between">
              <Title order={6} size="xs">Result</Title>
              <Badge color="green" size="sm">Complete</Badge>
            </Group>
            <Group gap="md">
              <Box>
                <Text size="xs" c="dimmed">Output File</Text>
                <Code style={{ fontSize: '10px' }}>{outputFile}</Code>
              </Box>
            </Group>
            <Button
              variant="light"
              leftSection={<IconDownload size={14} />}
              size="xs"
            >
              Download Result
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
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

      // Auto-stop after 3 seconds (help exits immediately, this ensures cleanup)
      setTimeout(async () => {
        try {
          await str2strApi.stopStr2Str({ process_id: result.id });
          setProcessState('idle');
          setProcessId(null);
        } catch (err) {
          console.error('Auto-stop failed:', err);
        }
      }, 3000);
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
