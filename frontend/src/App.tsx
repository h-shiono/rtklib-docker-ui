import { useState, useEffect } from 'react';
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
} from '@tabler/icons-react';
import { TerminalOutput, StatusIndicator, ConfigLoader, ProcessStatus } from './components';

// Sample log data for demo
const sampleLogLines = [
  '2026/01/01 12:00:00 RTKLIB started',
  '2026/01/01 12:00:01 Loading configuration...',
  '2026/01/01 12:00:02 Configuration loaded successfully',
  '2026/01/01 12:00:03 Opening input files...',
  '2026/01/01 12:00:04 Rover: /workspace/rover.obs',
  '2026/01/01 12:00:05 Base:  /workspace/base.obs',
  '2026/01/01 12:00:06 Nav:   /workspace/nav.nav',
  '2026/01/01 12:00:07 Processing epoch 1/1000...',
];

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

  const handleStart = () => {
    setProcessStatus('running');
    setLogLines([]);

    // Simulate processing
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

          {/* Action Area - Sticky Bottom */}
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

          {/* Result Card (shown after completion) */}
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

function StreamServerPanel() {
  return (
    <Card withBorder>
      <Stack gap="md" align="center" py="xl">
        <IconSatellite size={48} opacity={0.5} />
        <Title order={4} c="dimmed">Stream Server</Title>
        <Text size="sm" c="dimmed">Real-time GNSS data streaming with str2str</Text>
        <Badge>Coming Soon</Badge>
      </Stack>
    </Card>
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
  const [activeTab, setActiveTab] = useState<string | null>('post-processing');
  const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus(data.status === 'ok' ? 'ok' : 'error');
      })
      .catch(() => {
        setHealthStatus('error');
      });
  }, []);

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          {/* Logo & Title */}
          <Group gap="sm">
            <IconSatellite size={28} />
            <Title order={4} visibleFrom="sm">RTKLIB Web UI</Title>
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
              <Tabs.Tab value="stream-server">Stream Server</Tabs.Tab>
              <Tabs.Tab value="conversion">Conversion</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {/* Right Controls */}
          <Group gap="sm">
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
            <Tabs.Tab value="stream-server">Stream</Tabs.Tab>
            <Tabs.Tab value="conversion">Convert</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Tab Content */}
        {activeTab === 'post-processing' && <PostProcessingPanel />}
        {activeTab === 'stream-server' && <StreamServerPanel />}
        {activeTab === 'conversion' && <ConversionPanel />}
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
