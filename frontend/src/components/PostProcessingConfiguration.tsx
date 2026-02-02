import { useState } from 'react';
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
  Accordion,
  Fieldset,
  TextInput,
  Checkbox,
  Button,
} from '@mantine/core';
import {
  IconAdjustments,
  IconAdjustmentsHorizontal,
  IconChartLine,
  IconDatabaseExport,
  IconDots,
  IconFolderOpen,
  IconMapPin,
} from '@tabler/icons-react';
import type {
  Rnx2RtkpConfig,
  PositioningMode,
  Frequency,
  FilterType,
  IonosphereCorrection,
  TroposphereCorrection,
  EphemerisOption,
  EarthTidesCorrection,
  ReceiverDynamics,
  GpsArMode,
  GloArMode,
  BdsArMode,
  SolutionFormat,
  TimeFormat,
  LatLonFormat,
  Datum,
  HeightType,
  GeoidModel,
  StaticSolutionMode,
  DebugTraceLevel,
  SnrMaskConfig,
} from '../types/rnx2rtkpConfig';
import { DEFAULT_RNX2RTKP_CONFIG } from '../types/rnx2rtkpConfig';
import { SnrMaskModal } from './SnrMaskModal';

interface PostProcessingConfigurationProps {
  onConfigChange: (config: Rnx2RtkpConfig) => void;
}

export function PostProcessingConfiguration({
  onConfigChange,
}: PostProcessingConfigurationProps) {
  const [config, setConfig] = useLocalStorage<Rnx2RtkpConfig>({
    key: 'rtklib-web-ui-rnx2rtkp-config-v6', // v6: Stats tab added
    defaultValue: DEFAULT_RNX2RTKP_CONFIG,
  });

  const [snrMaskModalOpened, setSnrMaskModalOpened] = useState(false);

  const handleConfigChange = (newConfig: Rnx2RtkpConfig) => {
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <>
    <Card withBorder p="xs">
      <Stack gap="xs">
        <Title order={6} size="xs">
          Processing Configuration
        </Title>

        <Tabs defaultValue="setting1">
          <Tabs.List>
            <Tabs.Tab value="setting1" style={{ fontSize: '11px', padding: '6px 12px' }} leftSection={<IconAdjustments size={14} />}>
              Setting 1
            </Tabs.Tab>
            <Tabs.Tab value="setting2" style={{ fontSize: '11px', padding: '6px 12px' }} leftSection={<IconAdjustmentsHorizontal size={14} />}>
              Setting 2
            </Tabs.Tab>
            <Tabs.Tab value="output" style={{ fontSize: '11px', padding: '6px 12px' }} leftSection={<IconDatabaseExport size={14} />}>
              Output
            </Tabs.Tab>
            <Tabs.Tab value="stats" style={{ fontSize: '11px', padding: '6px 12px' }} leftSection={<IconChartLine size={14} />}>
              Stats
            </Tabs.Tab>
            <Tabs.Tab value="positions" style={{ fontSize: '11px', padding: '6px 12px' }} leftSection={<IconMapPin size={14} />}>
              Positions
            </Tabs.Tab>
            <Tabs.Tab value="files" style={{ fontSize: '11px', padding: '6px 12px' }} leftSection={<IconFolderOpen size={14} />}>
              Files
            </Tabs.Tab>
            <Tabs.Tab value="misc" style={{ fontSize: '11px', padding: '6px 12px' }} leftSection={<IconDots size={14} />}>
              Misc
            </Tabs.Tab>
          </Tabs.List>

          {/* Tab 1: Setting 1 */}
          <Tabs.Panel value="setting1" pt="xs">
            <Stack gap="xs">
              {/* Group A: Basic Strategy */}
              <Fieldset legend="Basic Strategy" style={{ fontSize: '10px' }}>
                <SimpleGrid cols={3} spacing="xs">
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

                  <Select
                    size="xs"
                    label="Filter Type"
                    value={config.setting1.filterType}
                    onChange={(value) =>
                      handleConfigChange({
                        ...config,
                        setting1: { ...config.setting1, filterType: value as FilterType },
                      })
                    }
                    data={[
                      { value: 'forward', label: 'Forward' },
                      { value: 'backward', label: 'Backward' },
                      { value: 'combined', label: 'Combined' },
                    ]}
                    styles={{ label: { fontSize: '10px' } }}
                  />
                </SimpleGrid>
              </Fieldset>

              {/* Group B: Masks & Environment */}
              <Fieldset legend="Masks & Environment" style={{ fontSize: '10px' }}>
                <SimpleGrid cols={2} spacing="xs">
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

                  <div>
                    <Text size="xs" style={{ fontSize: '10px', marginBottom: '4px' }}>
                      SNR Mask
                    </Text>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => setSnrMaskModalOpened(true)}
                      fullWidth
                    >
                      Edit SNR Mask...
                    </Button>
                  </div>

                  <Select
                    size="xs"
                    label="Ionosphere Correction"
                    value={config.setting1.ionosphereCorrection}
                    onChange={(value) =>
                      handleConfigChange({
                        ...config,
                        setting1: {
                          ...config.setting1,
                          ionosphereCorrection: value as IonosphereCorrection,
                        },
                      })
                    }
                    data={[
                      { value: 'off', label: 'OFF' },
                      { value: 'broadcast', label: 'Broadcast' },
                      { value: 'sbas', label: 'SBAS' },
                      { value: 'dual-freq', label: 'Dual-Frequency' },
                      { value: 'est-stec', label: 'Estimate STEC' },
                      { value: 'ionex-tec', label: 'IONEX TEC' },
                    ]}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <Select
                    size="xs"
                    label="Troposphere Correction"
                    value={config.setting1.troposphereCorrection}
                    onChange={(value) =>
                      handleConfigChange({
                        ...config,
                        setting1: {
                          ...config.setting1,
                          troposphereCorrection: value as TroposphereCorrection,
                        },
                      })
                    }
                    data={[
                      { value: 'off', label: 'OFF' },
                      { value: 'saastamoinen', label: 'Saastamoinen' },
                      { value: 'sbas', label: 'SBAS' },
                      { value: 'est-ztd', label: 'Estimate ZTD' },
                      { value: 'est-ztd-grad', label: 'Estimate ZTD+Grad' },
                    ]}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <Select
                    size="xs"
                    label="Satellite Ephemeris"
                    value={config.setting1.ephemerisOption}
                    onChange={(value) =>
                      handleConfigChange({
                        ...config,
                        setting1: {
                          ...config.setting1,
                          ephemerisOption: value as EphemerisOption,
                        },
                      })
                    }
                    data={[
                      { value: 'broadcast', label: 'Broadcast' },
                      { value: 'precise', label: 'Precise' },
                      { value: 'broadcast+sbas', label: 'Broadcast+SBAS' },
                      { value: 'broadcast+ssrapc', label: 'Broadcast+SSR APC' },
                      { value: 'broadcast+ssrcom', label: 'Broadcast+SSR CoM' },
                    ]}
                    styles={{ label: { fontSize: '10px' } }}
                  />
                </SimpleGrid>
              </Fieldset>

              {/* Group C: Satellite Selection */}
              <Fieldset legend="Satellite Selection" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <Text size="xs" style={{ fontSize: '10px' }}>
                    Constellations
                  </Text>
                  <Group gap="xs">
                    <Checkbox
                      size="xs"
                      label="GPS"
                      checked={config.setting1.constellations.gps}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          setting1: {
                            ...config.setting1,
                            constellations: {
                              ...config.setting1.constellations,
                              gps: e.currentTarget.checked,
                            },
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Checkbox
                      size="xs"
                      label="GLONASS"
                      checked={config.setting1.constellations.glonass}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          setting1: {
                            ...config.setting1,
                            constellations: {
                              ...config.setting1.constellations,
                              glonass: e.currentTarget.checked,
                            },
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Checkbox
                      size="xs"
                      label="Galileo"
                      checked={config.setting1.constellations.galileo}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          setting1: {
                            ...config.setting1,
                            constellations: {
                              ...config.setting1.constellations,
                              galileo: e.currentTarget.checked,
                            },
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Checkbox
                      size="xs"
                      label="QZSS"
                      checked={config.setting1.constellations.qzss}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          setting1: {
                            ...config.setting1,
                            constellations: {
                              ...config.setting1.constellations,
                              qzss: e.currentTarget.checked,
                            },
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Checkbox
                      size="xs"
                      label="SBAS"
                      checked={config.setting1.constellations.sbas}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          setting1: {
                            ...config.setting1,
                            constellations: {
                              ...config.setting1.constellations,
                              sbas: e.currentTarget.checked,
                            },
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Checkbox
                      size="xs"
                      label="BeiDou"
                      checked={config.setting1.constellations.beidou}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          setting1: {
                            ...config.setting1,
                            constellations: {
                              ...config.setting1.constellations,
                              beidou: e.currentTarget.checked,
                            },
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Checkbox
                      size="xs"
                      label="IRNSS"
                      checked={config.setting1.constellations.irnss}
                      onChange={(e) =>
                        handleConfigChange({
                          ...config,
                          setting1: {
                            ...config.setting1,
                            constellations: {
                              ...config.setting1.constellations,
                              irnss: e.currentTarget.checked,
                            },
                          },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </Group>

                  <TextInput
                    size="xs"
                    label="Excluded Satellites"
                    placeholder="e.g., G04 G05 R09"
                    value={config.setting1.excludedSatellites}
                    onChange={(e: any) =>
                      handleConfigChange({
                        ...config,
                        setting1: {
                          ...config.setting1,
                          excludedSatellites: e.currentTarget.value,
                        },
                      })
                    }
                    styles={{ label: { fontSize: '10px' } }}
                  />
                </Stack>
              </Fieldset>

              {/* Group D: Advanced Options */}
              <Accordion variant="contained">
                <Accordion.Item value="advanced">
                  <Accordion.Control style={{ fontSize: '10px', padding: '6px 12px' }}>
                    Advanced Settings & Corrections
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      <SimpleGrid cols={2} spacing="xs">
                        <Select
                          size="xs"
                          label="Earth Tides Correction"
                          value={config.setting1.earthTidesCorrection}
                          onChange={(value: any) =>
                            handleConfigChange({
                              ...config,
                              setting1: {
                                ...config.setting1,
                                earthTidesCorrection: value as EarthTidesCorrection,
                              },
                            })
                          }
                          data={[
                            { value: 'off', label: 'OFF' },
                            { value: 'solid', label: 'Solid' },
                            { value: 'solid+otl', label: 'Solid+OTL' },
                            { value: 'solid+otl+pole', label: 'Solid+OTL+Pole' },
                          ]}
                          styles={{ label: { fontSize: '10px' } }}
                        />

                        <Select
                          size="xs"
                          label="Receiver Dynamics"
                          value={config.setting1.receiverDynamics}
                          onChange={(value: any) =>
                            handleConfigChange({
                              ...config,
                              setting1: {
                                ...config.setting1,
                                receiverDynamics: value as ReceiverDynamics,
                              },
                            })
                          }
                          data={[
                            { value: 'off', label: 'OFF' },
                            { value: 'on', label: 'ON' },
                          ]}
                          styles={{ label: { fontSize: '10px' } }}
                        />
                      </SimpleGrid>

                      <Text size="xs" style={{ fontSize: '10px' }}>
                        Corrections & Options
                      </Text>
                      <Group gap="xs">
                        <Switch
                          size="xs"
                          label="Satellite PCV"
                          checked={config.setting1.satellitePcv}
                          onChange={(e: any) =>
                            handleConfigChange({
                              ...config,
                              setting1: {
                                ...config.setting1,
                                satellitePcv: e.currentTarget.checked,
                              },
                            })
                          }
                          styles={{ label: { fontSize: '10px' } }}
                        />
                        <Switch
                          size="xs"
                          label="Receiver PCV"
                          checked={config.setting1.receiverPcv}
                          onChange={(e: any) =>
                            handleConfigChange({
                              ...config,
                              setting1: {
                                ...config.setting1,
                                receiverPcv: e.currentTarget.checked,
                              },
                            })
                          }
                          styles={{ label: { fontSize: '10px' } }}
                        />
                        <Switch
                          size="xs"
                          label="Phase Windup"
                          checked={config.setting1.phaseWindup}
                          onChange={(e: any) =>
                            handleConfigChange({
                              ...config,
                              setting1: {
                                ...config.setting1,
                                phaseWindup: e.currentTarget.checked,
                              },
                            })
                          }
                          styles={{ label: { fontSize: '10px' } }}
                        />
                        <Switch
                          size="xs"
                          label="Reject Eclipse"
                          checked={config.setting1.rejectEclipse}
                          onChange={(e: any) =>
                            handleConfigChange({
                              ...config,
                              setting1: {
                                ...config.setting1,
                                rejectEclipse: e.currentTarget.checked,
                              },
                            })
                          }
                          styles={{ label: { fontSize: '10px' } }}
                        />
                        <Switch
                          size="xs"
                          label="RAIM FDE"
                          checked={config.setting1.raimFde}
                          onChange={(e: any) =>
                            handleConfigChange({
                              ...config,
                              setting1: {
                                ...config.setting1,
                                raimFde: e.currentTarget.checked,
                              },
                            })
                          }
                          styles={{ label: { fontSize: '10px' } }}
                        />
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </Tabs.Panel>

          {/* Tab 2: Setting 2 */}
          <Tabs.Panel value="setting2" pt="xs">
            <Stack gap="xs">
              {/* Section A: Ambiguity Resolution Strategy */}
              <Fieldset legend="Ambiguity Resolution Strategy" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <Text size="xs" style={{ fontSize: '10px' }}>
                    Integer Ambiguity Res (GPS/GLO/BDS)
                  </Text>
                  <SimpleGrid cols={3} spacing="xs">
                    <Select
                      size="xs"
                      label="GPS"
                      value={config.setting2.gpsArMode}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, gpsArMode: value as GpsArMode },
                        })
                      }
                      data={[
                        { value: 'off', label: 'OFF' },
                        { value: 'continuous', label: 'Continuous' },
                        { value: 'instantaneous', label: 'Instantaneous' },
                        { value: 'fix-and-hold', label: 'Fix and Hold' },
                        { value: 'ppp-ar', label: 'PPP-AR' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />

                    <Select
                      size="xs"
                      label="GLO"
                      value={config.setting2.gloArMode}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, gloArMode: value as GloArMode },
                        })
                      }
                      data={[
                        { value: 'off', label: 'OFF' },
                        { value: 'on', label: 'ON' },
                        { value: 'autocal', label: 'Autocal' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />

                    <Select
                      size="xs"
                      label="BDS"
                      value={config.setting2.bdsArMode}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, bdsArMode: value as BdsArMode },
                        })
                      }
                      data={[
                        { value: 'off', label: 'OFF' },
                        { value: 'on', label: 'ON' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <NumberInput
                    size="xs"
                    label="Min Ratio to Fix Ambiguity"
                    value={config.setting2.minRatioToFix}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        setting2: { ...config.setting2, minRatioToFix: Number(value) },
                      })
                    }
                    min={1}
                    max={10}
                    step={0.1}
                    decimalScale={1}
                    styles={{ label: { fontSize: '10px' } }}
                  />
                </Stack>
              </Fieldset>

              {/* Section B: Thresholds & Validation */}
              <Fieldset legend="Thresholds & Validation" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Min Confidence"
                      value={config.setting2.minConfidence}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, minConfidence: Number(value) },
                        })
                      }
                      min={0}
                      max={1}
                      step={0.0001}
                      decimalScale={4}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="Max FCB"
                      value={config.setting2.maxFcb}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, maxFcb: Number(value) },
                        })
                      }
                      min={0}
                      step={0.01}
                      decimalScale={2}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Min Lock to Fix Amb"
                      value={config.setting2.minLockToFix}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, minLockToFix: Number(value) },
                        })
                      }
                      min={0}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="Elevation (°) to Fix Amb"
                      value={config.setting2.minElevationToFix}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, minElevationToFix: Number(value) },
                        })
                      }
                      min={0}
                      max={90}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Min Fix to Hold Amb"
                      value={config.setting2.minFixToHold}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, minFixToHold: Number(value) },
                        })
                      }
                      min={0}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="Elevation (°) to Hold Amb"
                      value={config.setting2.minElevationToHold}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, minElevationToHold: Number(value) },
                        })
                      }
                      min={0}
                      max={90}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Outage to Reset Amb"
                      value={config.setting2.outageToReset}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, outageToReset: Number(value) },
                        })
                      }
                      min={0}
                      step={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="Slip Threshold (m)"
                      value={config.setting2.slipThreshold}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, slipThreshold: Number(value) },
                        })
                      }
                      min={0}
                      step={0.001}
                      decimalScale={3}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Max Age of Diff (s)"
                      value={config.setting2.maxAgeDiff}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, maxAgeDiff: Number(value) },
                        })
                      }
                      min={0}
                      step={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Checkbox
                      size="xs"
                      label="Sync Solution"
                      checked={config.setting2.syncSolution}
                      onChange={(e: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, syncSolution: e.currentTarget.checked },
                        })
                      }
                      styles={{ label: { fontSize: '10px' }, root: { marginTop: '20px' } }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Reject Threshold of GDOP"
                      value={config.setting2.rejectThresholdGdop}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, rejectThresholdGdop: Number(value) },
                        })
                      }
                      min={0}
                      step={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="Innov (m)"
                      value={config.setting2.rejectThresholdInnovation}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          setting2: { ...config.setting2, rejectThresholdInnovation: Number(value) },
                        })
                      }
                      min={0}
                      step={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>
                </Stack>
              </Fieldset>

              {/* Section C: Advanced Filter */}
              <Fieldset legend="Advanced Filter" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <NumberInput
                    size="xs"
                    label="Number of Filter Iteration"
                    value={config.setting2.numFilterIterations}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        setting2: { ...config.setting2, numFilterIterations: Number(value) },
                      })
                    }
                    min={1}
                    max={10}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <Checkbox
                    size="xs"
                    label="Baseline Length Constraint"
                    checked={config.setting2.baselineLengthConstraint.enabled}
                    onChange={(e: any) =>
                      handleConfigChange({
                        ...config,
                        setting2: {
                          ...config.setting2,
                          baselineLengthConstraint: {
                            ...config.setting2.baselineLengthConstraint,
                            enabled: e.currentTarget.checked,
                          },
                        },
                      })
                    }
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  {config.setting2.baselineLengthConstraint.enabled && (
                    <SimpleGrid cols={2} spacing="xs">
                      <NumberInput
                        size="xs"
                        label="Length (m)"
                        value={config.setting2.baselineLengthConstraint.length}
                        onChange={(value: any) =>
                          handleConfigChange({
                            ...config,
                            setting2: {
                              ...config.setting2,
                              baselineLengthConstraint: {
                                ...config.setting2.baselineLengthConstraint,
                                length: Number(value),
                              },
                            },
                          })
                        }
                        min={0}
                        step={0.001}
                        decimalScale={3}
                        styles={{ label: { fontSize: '10px' } }}
                      />
                      <NumberInput
                        size="xs"
                        label="Sigma (m)"
                        value={config.setting2.baselineLengthConstraint.sigma}
                        onChange={(value: any) =>
                          handleConfigChange({
                            ...config,
                            setting2: {
                              ...config.setting2,
                              baselineLengthConstraint: {
                                ...config.setting2.baselineLengthConstraint,
                                sigma: Number(value),
                              },
                            },
                          })
                        }
                        min={0}
                        step={0.001}
                        decimalScale={3}
                        styles={{ label: { fontSize: '10px' } }}
                      />
                    </SimpleGrid>
                  )}
                </Stack>
              </Fieldset>
            </Stack>
          </Tabs.Panel>

          {/* Tab 3: Output */}
          <Tabs.Panel value="output" pt="xs">
            <Stack gap="xs">
              {/* Group A: Format Configuration */}
              <Fieldset legend="Format Configuration" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <SimpleGrid cols={2} spacing="xs">
                    <Select
                      size="xs"
                      label="Solution Format"
                      value={config.output.solutionFormat}
                      onChange={(value: any) =>
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
                        { value: 'solution-status', label: 'Solution Status' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />

                    <div>
                      <Text size="xs" style={{ fontSize: '10px', marginBottom: '4px' }}>
                        Header / Options / Velocity
                      </Text>
                      <Group gap="xs">
                        <Switch
                          size="xs"
                          label="Header"
                          checked={config.output.outputHeader}
                          onChange={(e: any) =>
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
                          label="Options"
                          checked={config.output.outputProcessingOptions}
                          onChange={(e: any) =>
                            handleConfigChange({
                              ...config,
                              output: {
                                ...config.output,
                                outputProcessingOptions: e.currentTarget.checked,
                              },
                            })
                          }
                          styles={{ label: { fontSize: '10px' } }}
                        />
                        <Switch
                          size="xs"
                          label="Velocity"
                          checked={config.output.outputVelocity}
                          onChange={(e: any) =>
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

                  <SimpleGrid cols={2} spacing="xs">
                    <Select
                      size="xs"
                      label="Time Format"
                      value={config.output.timeFormat}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, timeFormat: value as TimeFormat },
                        })
                      }
                      data={[
                        { value: 'gpst', label: 'ww:ssss GPST' },
                        { value: 'utc', label: 'hh:mm:ss UTC' },
                        { value: 'jst', label: 'hh:mm:ss JST' },
                        { value: 'tow', label: 'TOW' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="# of Decimals"
                      value={config.output.numDecimals}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, numDecimals: Number(value) },
                        })
                      }
                      min={0}
                      max={12}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
                    <Select
                      size="xs"
                      label="Latitude / Longitude Format"
                      value={config.output.latLonFormat}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, latLonFormat: value as LatLonFormat },
                        })
                      }
                      data={[
                        { value: 'ddd.ddddddd', label: 'ddd.ddddddd' },
                        { value: 'ddd-mm-ss.sss', label: 'ddd mm ss.sss' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />

                    <TextInput
                      size="xs"
                      label="Field Separator"
                      placeholder="Space (default)"
                      value={config.output.fieldSeparator}
                      onChange={(e: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, fieldSeparator: e.currentTarget.value },
                        })
                      }
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>
                </Stack>
              </Fieldset>

              {/* Group B: Datum & Geoid */}
              <Fieldset legend="Datum & Geoid" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <SimpleGrid cols={2} spacing="xs">
                    <Select
                      size="xs"
                      label="Datum"
                      value={config.output.datum}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, datum: value as Datum },
                        })
                      }
                      data={[
                        { value: 'wgs84', label: 'WGS84' },
                        { value: 'tokyo', label: 'Tokyo' },
                        { value: 'pz90.11', label: 'PZ-90.11' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Select
                      size="xs"
                      label="Height"
                      value={config.output.height}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, height: value as HeightType },
                        })
                      }
                      data={[
                        { value: 'ellipsoidal', label: 'Ellipsoidal' },
                        { value: 'geodetic', label: 'Geodetic' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <Select
                    size="xs"
                    label="Geoid Model"
                    value={config.output.geoidModel}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        output: { ...config.output, geoidModel: value as GeoidModel },
                      })
                    }
                    data={[
                      { value: 'internal', label: 'Internal' },
                      { value: 'egm96', label: 'EGM96' },
                      { value: 'egm08', label: 'Earth Grav Model 2008' },
                      { value: 'gsi2000', label: 'GSI2000 (Japan)' },
                    ]}
                    styles={{ label: { fontSize: '10px' } }}
                  />
                </Stack>
              </Fieldset>

              {/* Group C: Output Control */}
              <Fieldset legend="Output Control" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <Select
                    size="xs"
                    label="Solution for Static Mode"
                    value={config.output.staticSolutionMode}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        output: { ...config.output, staticSolutionMode: value as StaticSolutionMode },
                      })
                    }
                    data={[
                      { value: 'all', label: 'All' },
                      { value: 'single', label: 'Single' },
                      { value: 'fixed', label: 'Fixed' },
                    ]}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="NMEA Interval (s) - RMC/GGA"
                      value={config.output.nmeaIntervalRmcGga}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, nmeaIntervalRmcGga: Number(value) },
                        })
                      }
                      min={0}
                      step={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="GSA/GSV"
                      value={config.output.nmeaIntervalGsaGsv}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, nmeaIntervalGsaGsv: Number(value) },
                        })
                      }
                      min={0}
                      step={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
                    <Select
                      size="xs"
                      label="Output Sol Status"
                      value={config.output.outputSolutionStatus}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, outputSolutionStatus: value as DebugTraceLevel },
                        })
                      }
                      data={[
                        { value: 'off', label: 'OFF' },
                        { value: 'level1', label: 'State' },
                        { value: 'level2', label: 'Residual' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <Select
                      size="xs"
                      label="Debug Trace"
                      value={config.output.debugTrace}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          output: { ...config.output, debugTrace: value as DebugTraceLevel },
                        })
                      }
                      data={[
                        { value: 'off', label: 'OFF' },
                        { value: 'level1', label: 'Level 1' },
                        { value: 'level2', label: 'Level 2' },
                        { value: 'level3', label: 'Level 3' },
                        { value: 'level4', label: 'Level 4' },
                        { value: 'level5', label: 'Level 5' },
                      ]}
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>
                </Stack>
              </Fieldset>
            </Stack>
          </Tabs.Panel>

          {/* Tab 4: Stats */}
          <Tabs.Panel value="stats" pt="xs">
            <Stack gap="xs">
              {/* Group A: Measurement Errors (1-sigma) */}
              <Fieldset legend="Measurement Errors (1-sigma)" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Code/Phase Ratio L1"
                      value={config.stats.codePhaseRatioL1}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          stats: { ...config.stats, codePhaseRatioL1: Number(value) },
                        })
                      }
                      min={0}
                      step={1}
                      decimalScale={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="L2"
                      value={config.stats.codePhaseRatioL2}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          stats: { ...config.stats, codePhaseRatioL2: Number(value) },
                        })
                      }
                      min={0}
                      step={1}
                      decimalScale={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Phase Error a (m)"
                      value={config.stats.phaseErrorA}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          stats: { ...config.stats, phaseErrorA: Number(value) },
                        })
                      }
                      min={0}
                      step={0.001}
                      decimalScale={3}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="b/sinEl (m)"
                      value={config.stats.phaseErrorB}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          stats: { ...config.stats, phaseErrorB: Number(value) },
                        })
                      }
                      min={0}
                      step={0.001}
                      decimalScale={3}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <NumberInput
                    size="xs"
                    label="Phase Error/Baseline (m/10km)"
                    value={config.stats.phaseErrorBaseline}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        stats: { ...config.stats, phaseErrorBaseline: Number(value) },
                      })
                    }
                    min={0}
                    step={0.001}
                    decimalScale={3}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <NumberInput
                    size="xs"
                    label="Doppler Frequency (Hz)"
                    value={config.stats.dopplerFrequency}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        stats: { ...config.stats, dopplerFrequency: Number(value) },
                      })
                    }
                    min={0}
                    step={0.1}
                    decimalScale={1}
                    styles={{ label: { fontSize: '10px' } }}
                  />
                </Stack>
              </Fieldset>

              {/* Group B: Process Noises (1-sigma/sqrt(s)) */}
              <Fieldset legend="Process Noises (1-sigma/sqrt(s))" style={{ fontSize: '10px' }}>
                <Stack gap="xs">
                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Receiver Accel Horiz (m/s²)"
                      value={config.stats.receiverAccelHoriz}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          stats: { ...config.stats, receiverAccelHoriz: Number(value) },
                        })
                      }
                      min={0}
                      step={0.1}
                      decimalScale={1}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                    <NumberInput
                      size="xs"
                      label="Vertical (m/s²)"
                      value={config.stats.receiverAccelVert}
                      onChange={(value: any) =>
                        handleConfigChange({
                          ...config,
                          stats: { ...config.stats, receiverAccelVert: Number(value) },
                        })
                      }
                      min={0}
                      step={0.01}
                      decimalScale={2}
                      hideControls
                      styles={{ label: { fontSize: '10px' } }}
                    />
                  </SimpleGrid>

                  <NumberInput
                    size="xs"
                    label="Carrier-Phase Bias (cycle)"
                    value={config.stats.carrierPhaseBias}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        stats: { ...config.stats, carrierPhaseBias: Number(value) },
                      })
                    }
                    min={0}
                    step={0.0001}
                    decimalScale={4}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <NumberInput
                    size="xs"
                    label="Vertical Ionospheric Delay (m/10km)"
                    value={config.stats.ionosphericDelay}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        stats: { ...config.stats, ionosphericDelay: Number(value) },
                      })
                    }
                    min={0}
                    step={0.001}
                    decimalScale={3}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <NumberInput
                    size="xs"
                    label="Zenith Tropospheric Delay (m)"
                    value={config.stats.troposphericDelay}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        stats: { ...config.stats, troposphericDelay: Number(value) },
                      })
                    }
                    min={0}
                    step={0.0001}
                    decimalScale={4}
                    styles={{ label: { fontSize: '10px' } }}
                  />

                  <NumberInput
                    size="xs"
                    label="Satellite Clock Stability (s/s)"
                    value={config.stats.satelliteClockStability}
                    onChange={(value: any) =>
                      handleConfigChange({
                        ...config,
                        stats: { ...config.stats, satelliteClockStability: Number(value) },
                      })
                    }
                    min={0}
                    step={1e-12}
                    decimalScale={12}
                    styles={{ label: { fontSize: '10px' } }}
                  />
                </Stack>
              </Fieldset>
            </Stack>
          </Tabs.Panel>

          {/* Tab 5: Positions */}
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

      <SnrMaskModal
        opened={snrMaskModalOpened}
        onClose={() => setSnrMaskModalOpened(false)}
        value={config.setting1.snrMask}
        onChange={(newSnrMask: SnrMaskConfig) =>
          handleConfigChange({
            ...config,
            setting1: { ...config.setting1, snrMask: newSnrMask },
          })
        }
      />
    </>
  );
}
