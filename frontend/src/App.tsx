import { useEffect, useState } from 'react';
import {
  AppShell,
  Box,
  Button,
  Card,
  Code,
  Container,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
  ActionIcon,
  Badge,
  Divider,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconSatellite,
  IconActivity,
  IconCheck,
} from '@tabler/icons-react';

// Sample RTKLIB-style log data
const sampleLogData = `2024/01/15 12:34:56.123 GPST  35.6812345  139.7654321  45.123  5  0.0123  0.0234  0.0456
2024/01/15 12:34:57.123 GPST  35.6812346  139.7654322  45.125  5  0.0121  0.0232  0.0454
2024/01/15 12:34:58.123 GPST  35.6812347  139.7654323  45.127  5  0.0119  0.0230  0.0452
2024/01/15 12:34:59.123 GPST  35.6812348  139.7654324  45.129  5  0.0117  0.0228  0.0450
2024/01/15 12:35:00.123 GPST  35.6812349  139.7654325  45.131  5  0.0115  0.0226  0.0448
2024/01/15 12:35:01.123 GPST  35.6812350  139.7654326  45.133  5  0.0113  0.0224  0.0446
2024/01/15 12:35:02.123 GPST  35.6812351  139.7654327  45.135  5  0.0111  0.0222  0.0444
2024/01/15 12:35:03.123 GPST  35.6812352  139.7654328  45.137  5  0.0109  0.0220  0.0442`;

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

function App() {
  const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'error'>(
    'loading'
  );

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setHealthStatus('ok');
        } else {
          setHealthStatus('error');
        }
      })
      .catch(() => {
        setHealthStatus('error');
      });
  }, []);

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <IconSatellite size={28} />
            <Title order={3}>RTKLIB Web UI</Title>
          </Group>
          <Group>
            <Badge
              color={healthStatus === 'ok' ? 'green' : healthStatus === 'error' ? 'red' : 'gray'}
              variant="dot"
              size="lg"
            >
              Backend: {healthStatus === 'loading' ? 'Checking...' : healthStatus.toUpperCase()}
            </Badge>
            <ColorSchemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          <Stack gap="lg">
            {/* Welcome Section */}
            <Card>
              <Stack gap="md">
                <Group>
                  <IconCheck size={24} color="var(--mantine-color-green-6)" />
                  <Title order={4}>Setup Complete</Title>
                </Group>
                <Text>
                  Welcome to RTKLIB Web UI. This interface provides a modern web-based
                  experience for RTKLIB&apos;s console applications.
                </Text>
                <Divider />
                <Text size="sm" c="dimmed">
                  Font Check: This text uses <strong>Inter</strong> font family.
                </Text>
              </Stack>
            </Card>

            {/* Sample Log Console */}
            <Card>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group>
                    <IconActivity size={20} />
                    <Title order={5}>Position Log (Sample Data)</Title>
                  </Group>
                  <Badge variant="light">JetBrains Mono</Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  This log area uses the monospace font for data display.
                </Text>
                <ScrollArea h={200}>
                  <Box
                    p="sm"
                    style={{
                      backgroundColor: 'var(--mantine-color-dark-8)',
                      borderRadius: 'var(--mantine-radius-sm)',
                    }}
                  >
                    <Code
                      block
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--mantine-color-green-4)',
                        whiteSpace: 'pre',
                        fontSize: '12px',
                        lineHeight: 1.6,
                      }}
                    >
                      {sampleLogData}
                    </Code>
                  </Box>
                </ScrollArea>
              </Stack>
            </Card>

            {/* Feature Cards */}
            <Group grow>
              <Card>
                <Stack gap="xs">
                  <Title order={5}>Post-Processing</Title>
                  <Text size="sm" c="dimmed">
                    Process RINEX observation data with rnx2rtkp
                  </Text>
                  <Button variant="light" disabled>
                    Coming Soon
                  </Button>
                </Stack>
              </Card>
              <Card>
                <Stack gap="xs">
                  <Title order={5}>Stream Server</Title>
                  <Text size="sm" c="dimmed">
                    Real-time data streaming with str2str
                  </Text>
                  <Button variant="light" disabled>
                    Coming Soon
                  </Button>
                </Stack>
              </Card>
              <Card>
                <Stack gap="xs">
                  <Title order={5}>Data Converter</Title>
                  <Text size="sm" c="dimmed">
                    Convert binary data with convbin
                  </Text>
                  <Button variant="light" disabled>
                    Coming Soon
                  </Button>
                </Stack>
              </Card>
            </Group>

            {/* Coordinate Display Sample */}
            <Card>
              <Stack gap="md">
                <Title order={5}>Sample Coordinate Display</Title>
                <Group grow>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                      Latitude
                    </Text>
                    <Code style={{ fontSize: '16px' }}>35.6812345</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                      Longitude
                    </Text>
                    <Code style={{ fontSize: '16px' }}>139.7654321</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                      Height
                    </Text>
                    <Code style={{ fontSize: '16px' }}>45.123 m</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                      Quality
                    </Text>
                    <Badge color="green" variant="filled">
                      FIX
                    </Badge>
                  </Box>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
