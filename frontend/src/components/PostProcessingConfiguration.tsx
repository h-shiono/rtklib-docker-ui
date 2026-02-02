import { useLocalStorage } from '@mantine/hooks';
import {
  Card,
  Stack,
  Tabs,
  Select,
  NumberInput,
  SimpleGrid,
  Text,
  Switch,
  Title,
  Group,
} from '@mantine/core';
import type {
  Rnx2RtkpConfig,
  PositioningMode,
  Frequency,
  ARMode,
  SolutionFormat,
} from '../types/rnx2rtkpConfig';
import { DEFAULT_RNX2RTKP_CONFIG } from '../types/rnx2rtkpConfig';

interface PostProcessingConfigurationProps {
  onConfigChange: (config: Rnx2RtkpConfig) => void;
}

export function PostProcessingConfiguration({
  onConfigChange,
}: PostProcessingConfigurationProps) {
  const [config, setConfig] = useLocalStorage<Rnx2RtkpConfig>({
    key: 'rtklib-web-ui-rnx2rtkp-config',
    defaultValue: DEFAULT_RNX2RTKP_CONFIG,
  });

  const handleConfigChange = (newConfig: Rnx2RtkpConfig) => {
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <Card withBorder p="xs">
      <Stack gap="xs">
        <Title order={6} size="xs">
          Processing Configuration
        </Title>

        <Tabs defaultValue="setting1">
          <Tabs.List>
            <Tabs.Tab value="setting1" style={{ fontSize: '11px', padding: '6px 12px' }}>
              Setting 1
            </Tabs.Tab>
            <Tabs.Tab value="setting2" style={{ fontSize: '11px', padding: '6px 12px' }}>
              Setting 2
            </Tabs.Tab>
            <Tabs.Tab value="output" style={{ fontSize: '11px', padding: '6px 12px' }}>
              Output
            </Tabs.Tab>
            <Tabs.Tab value="positions" style={{ fontSize: '11px', padding: '6px 12px' }}>
              Positions
            </Tabs.Tab>
            <Tabs.Tab value="files" style={{ fontSize: '11px', padding: '6px 12px' }}>
              Files
            </Tabs.Tab>
            <Tabs.Tab value="misc" style={{ fontSize: '11px', padding: '6px 12px' }}>
              Misc
            </Tabs.Tab>
          </Tabs.List>

          {/* Tab 1: Setting 1 */}
          <Tabs.Panel value="setting1" pt="xs">
            <Stack gap="xs">
              <SimpleGrid cols={2} spacing="xs">
                <Select
                  size="xs"
                  label="Positioning Mode"
                  value={config.setting1.positioningMode}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      setting1: {
                        ...config.setting1,
                        positioningMode: value as PositioningMode,
                      },
                    })
                  }
                  data={[
                    { value: 'single', label: 'Single' },
                    { value: 'dgps', label: 'DGPS' },
                    { value: 'kinematic', label: 'Kinematic' },
                    { value: 'static', label: 'Static' },
                    { value: 'moving-base', label: 'Moving-Base' },
                    { value: 'fixed', label: 'Fixed' },
                    { value: 'ppp-kinematic', label: 'PPP-Kinematic' },
                    { value: 'ppp-static', label: 'PPP-Static' },
                  ]}
                  styles={{ label: { fontSize: '10px' } }}
                />

                <Select
                  size="xs"
                  label="Frequencies"
                  value={config.setting1.frequency}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      setting1: { ...config.setting1, frequency: value as Frequency },
                    })
                  }
                  data={[
                    { value: 'l1', label: 'L1' },
                    { value: 'l1+l2', label: 'L1+L2' },
                    { value: 'l1+l2+l5', label: 'L1+L2+L5' },
                    { value: 'l1+l2+l5+l6', label: 'L1+L2+L5+L6' },
                    { value: 'l1+l2+l5+l6+l7', label: 'L1+L2+L5+L6+L7' },
                  ]}
                  styles={{ label: { fontSize: '10px' } }}
                />

                <NumberInput
                  size="xs"
                  label="Elevation Mask (deg)"
                  value={config.setting1.elevationMask}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      setting1: {
                        ...config.setting1,
                        elevationMask: Number(value),
                      },
                    })
                  }
                  min={0}
                  max={90}
                  styles={{ label: { fontSize: '10px' } }}
                />

                <NumberInput
                  size="xs"
                  label="SNR Mask (dB-Hz)"
                  value={config.setting1.snrMask}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      setting1: { ...config.setting1, snrMask: Number(value) },
                    })
                  }
                  min={0}
                  max={60}
                  styles={{ label: { fontSize: '10px' } }}
                />
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          {/* Tab 2: Setting 2 */}
          <Tabs.Panel value="setting2" pt="xs">
            <Stack gap="xs">
              <SimpleGrid cols={2} spacing="xs">
                <Select
                  size="xs"
                  label="Integer Ambiguity Resolution"
                  value={config.setting2.arMode}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      setting2: { ...config.setting2, arMode: value as ARMode },
                    })
                  }
                  data={[
                    { value: 'off', label: 'Off' },
                    { value: 'continuous', label: 'Continuous' },
                    { value: 'instantaneous', label: 'Instantaneous' },
                    { value: 'fix-and-hold', label: 'Fix and Hold' },
                  ]}
                  styles={{ label: { fontSize: '10px' } }}
                />

                <NumberInput
                  size="xs"
                  label="Min Ratio to Fix Ambiguity"
                  value={config.setting2.minRatioToFix}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      setting2: {
                        ...config.setting2,
                        minRatioToFix: Number(value),
                      },
                    })
                  }
                  min={1}
                  max={10}
                  step={0.1}
                  decimalScale={1}
                  styles={{ label: { fontSize: '10px' } }}
                />

                <NumberInput
                  size="xs"
                  label="Min Fix Samples"
                  value={config.setting2.minFixSamples}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      setting2: {
                        ...config.setting2,
                        minFixSamples: Number(value),
                      },
                    })
                  }
                  min={0}
                  max={100}
                  styles={{ label: { fontSize: '10px' } }}
                />

                <NumberInput
                  size="xs"
                  label="Min Hold Samples"
                  value={config.setting2.minHoldSamples}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      setting2: {
                        ...config.setting2,
                        minHoldSamples: Number(value),
                      },
                    })
                  }
                  min={0}
                  max={100}
                  styles={{ label: { fontSize: '10px' } }}
                />
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          {/* Tab 3: Output */}
          <Tabs.Panel value="output" pt="xs">
            <Stack gap="xs">
              <SimpleGrid cols={2} spacing="xs">
                <Select
                  size="xs"
                  label="Solution Format"
                  value={config.output.solutionFormat}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      output: {
                        ...config.output,
                        solutionFormat: value as SolutionFormat,
                      },
                    })
                  }
                  data={[
                    { value: 'llh', label: 'Lat/Lon/Height' },
                    { value: 'xyz', label: 'X/Y/Z-ECEF' },
                    { value: 'enu', label: 'E/N/U-Baseline' },
                    { value: 'nmea', label: 'NMEA-0183' },
                  ]}
                  styles={{ label: { fontSize: '10px' } }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Text size="xs" style={{ fontSize: '10px' }}>
                    Options
                  </Text>
                  <Group gap="xs">
                    <Switch
                      size="xs"
                      label="Header"
                      checked={config.output.outputHeader}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          output: {
                            ...config.output,
                            outputHeader: e.currentTarget.checked,
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Switch
                      size="xs"
                      label="Velocity"
                      checked={config.output.outputVelocity}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          output: {
                            ...config.output,
                            outputVelocity: e.currentTarget.checked,
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </Group>
                </div>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          {/* Tab 4: Positions */}
          <Tabs.Panel value="positions" pt="xs">
            <Stack gap="xs">
              <Switch
                size="xs"
                label="Use RINEX Header for Base Position"
                checked={config.basePosition.useRinexHeader}
                onChange={(e) =>
                  handleConfigChange({
                    ...config,
                    basePosition: {
                      ...config.basePosition,
                      useRinexHeader: e.currentTarget.checked,
                    },
                  })
                }
                styles={{ label: { fontSize: '10px' } }}
              />

              {!config.basePosition.useRinexHeader && (
                <SimpleGrid cols={3} spacing="xs">
                  <NumberInput
                    size="xs"
                    label="Latitude (deg)"
                    value={config.basePosition.latitude}
                    onChange={(value) =>
                      handleConfigChange({
                        ...config,
                        basePosition: {
                          ...config.basePosition,
                          latitude: Number(value),
                        },
                      })
                    }
                    min={-90}
                    max={90}
                    step={0.0001}
                    decimalScale={6}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <NumberInput
                    size="xs"
                    label="Longitude (deg)"
                    value={config.basePosition.longitude}
                    onChange={(value) =>
                      handleConfigChange({
                        ...config,
                        basePosition: {
                          ...config.basePosition,
                          longitude: Number(value),
                        },
                      })
                    }
                    min={-180}
                    max={180}
                    step={0.0001}
                    decimalScale={6}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <NumberInput
                    size="xs"
                    label="Height (m)"
                    value={config.basePosition.height}
                    onChange={(value) =>
                      handleConfigChange({
                        ...config,
                        basePosition: {
                          ...config.basePosition,
                          height: Number(value),
                        },
                      })
                    }
                    step={0.001}
                    decimalScale={3}
                    styles={{ label: { fontSize: '10px' } }}
                  />
                </SimpleGrid>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Tab 5: Files */}
          <Tabs.Panel value="files" pt="xs">
            <Stack gap="xs">
              <Text size="xs" c="dimmed">
                Auxiliary files (optional)
              </Text>
              {/* Placeholder for future implementation */}
              <Text size="xs" c="dimmed">
                ANTEX, Geoid, DCB, EOP files will be added in future updates
              </Text>
            </Stack>
          </Tabs.Panel>

          {/* Tab 6: Misc */}
          <Tabs.Panel value="misc" pt="xs">
            <Stack gap="xs">
              <SimpleGrid cols={2} spacing="xs">
                <Select
                  size="xs"
                  label="Time System"
                  value={config.misc.timeSystem}
                  onChange={(value) =>
                    handleConfigChange({
                      ...config,
                      misc: {
                        ...config.misc,
                        timeSystem: value as 'gpst' | 'utc' | 'jst',
                      },
                    })
                  }
                  data={[
                    { value: 'gpst', label: 'GPST' },
                    { value: 'utc', label: 'UTC' },
                    { value: 'jst', label: 'JST' },
                  ]}
                  styles={{ label: { fontSize: '10px' } }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Text size="xs" style={{ fontSize: '10px' }}>
                    Corrections
                  </Text>
                  <Group gap="xs">
                    <Switch
                      size="xs"
                      label="Iono"
                      checked={config.misc.ionosphereCorrection}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          misc: {
                            ...config.misc,
                            ionosphereCorrection: e.currentTarget.checked,
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Switch
                      size="xs"
                      label="Tropo"
                      checked={config.misc.troposphereCorrection}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          misc: {
                            ...config.misc,
                            troposphereCorrection: e.currentTarget.checked,
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </Group>
                </div>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  );
}
