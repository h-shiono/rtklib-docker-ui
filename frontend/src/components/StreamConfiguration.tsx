import { useState, useRef, useEffect } from 'react';
import {
  Card,
  Stack,
  Tabs,
  Select,
  TextInput,
  NumberInput,
  Group,
  ActionIcon,
  Button,
  Text,
  Textarea,
  Code,
  Divider,
  Title,
  PasswordInput,
  Alert,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconDownload,
  IconUpload,
  IconInfoCircle,
} from '@tabler/icons-react';
import { FileNamingHelper } from './FileNamingHelper';
import type {
  BuilderConfig,
  InputStream,
  OutputStream,
  StreamType,
  SerialParams,
  TcpClientParams,
  TcpServerParams,
  NtripClientParams,
  FileParams,
  ProfileConfig,
} from '../types/streamConfig';
import { generateStr2StrArgs, generateCommandString } from '../utils/streamArgs';

interface StreamConfigurationProps {
  onArgsChange: (args: string[]) => void;
}

const DEFAULT_INPUT: InputStream = {
  id: 'input-1',
  type: 'serial',
  params: {
    port: '/dev/ttyUSB0',
    baudrate: 115200,
    bytesize: 8,
    parity: 'N',
    stopbits: 1,
  } as SerialParams,
};

const DEFAULT_OUTPUT: OutputStream = {
  id: 'output-1',
  type: 'file',
  params: {
    path: '/workspace/output_%Y%m%d_%h%M%S.ubx',
  } as FileParams,
};

export function StreamConfiguration({ onArgsChange }: StreamConfigurationProps) {
  const [mode, setMode] = useState<'builder' | 'raw'>('builder');
  const [builderConfig, setBuilderConfig] = useState<BuilderConfig>({
    input: DEFAULT_INPUT,
    outputs: [DEFAULT_OUTPUT],
  });
  const [rawCommand, setRawCommand] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update args when config changes
  useEffect(() => {
    if (mode === 'builder') {
      const args = generateStr2StrArgs(builderConfig);
      onArgsChange(args);
    } else {
      // Parse raw command to args
      const args = rawCommand.trim().replace(/^str2str\s+/, '').split(/\s+/).filter(Boolean);
      onArgsChange(args);
    }
  }, [mode, builderConfig, rawCommand, onArgsChange]);

  const handleInputChange = (field: string, value: any) => {
    setBuilderConfig((prev) => ({
      ...prev,
      input: {
        ...prev.input,
        params: {
          ...prev.input.params,
          [field]: value,
        },
      },
    }));
  };

  const handleInputTypeChange = (type: StreamType) => {
    let params: any;
    switch (type) {
      case 'serial':
        params = { port: '/dev/ttyUSB0', baudrate: 115200, bytesize: 8, parity: 'N', stopbits: 1 };
        break;
      case 'tcpcli':
        params = { host: '192.168.1.100', port: 2101 };
        break;
      case 'tcpsvr':
        params = { port: 2101 };
        break;
      case 'ntripcli':
        params = { host: 'rtk2go.com', port: 2101, mountpoint: 'MOUNT', username: '', password: '' };
        break;
      case 'file':
        params = { path: '/workspace/input.ubx' };
        break;
    }
    setBuilderConfig((prev) => ({
      ...prev,
      input: { ...prev.input, type, params },
    }));
  };

  const handleOutputAdd = () => {
    const newOutput: OutputStream = {
      id: `output-${Date.now()}`,
      type: 'file',
      params: { path: '/workspace/output.ubx' } as FileParams,
    };
    setBuilderConfig((prev) => ({
      ...prev,
      outputs: [...prev.outputs, newOutput],
    }));
  };

  const handleOutputRemove = (id: string) => {
    setBuilderConfig((prev) => ({
      ...prev,
      outputs: prev.outputs.filter((o) => o.id !== id),
    }));
  };

  const handleOutputChange = (id: string, field: string, value: any) => {
    setBuilderConfig((prev) => ({
      ...prev,
      outputs: prev.outputs.map((output) =>
        output.id === id
          ? { ...output, params: { ...output.params, [field]: value } }
          : output
      ),
    }));
  };

  const handleOutputTypeChange = (id: string, type: StreamType) => {
    let params: any;
    switch (type) {
      case 'serial':
        params = { port: '/dev/ttyUSB0', baudrate: 115200 };
        break;
      case 'tcpcli':
        params = { host: '192.168.1.100', port: 2101 };
        break;
      case 'tcpsvr':
        params = { port: 2101 };
        break;
      case 'ntripcli':
        params = { host: 'rtk2go.com', port: 2101, mountpoint: 'MOUNT' };
        break;
      case 'file':
        params = { path: '/workspace/output.ubx' };
        break;
    }
    setBuilderConfig((prev) => ({
      ...prev,
      outputs: prev.outputs.map((output) =>
        output.id === id ? { ...output, type, params } : output
      ),
    }));
  };

  const handleExportProfile = () => {
    const profile: ProfileConfig = {
      name: 'Stream Configuration',
      description: 'Exported configuration profile',
      builder: builderConfig,
      raw: rawCommand,
      mode,
    };

    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `str2str-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const profile: ProfileConfig = JSON.parse(text);

      if (profile.builder) {
        setBuilderConfig(profile.builder);
      }
      if (profile.raw) {
        setRawCommand(profile.raw);
      }
      if (profile.mode) {
        setMode(profile.mode);
      }
    } catch (error) {
      alert('Failed to import profile: Invalid file format');
    }

    // Reset file input
    event.target.value = '';
  };

  const commandPreview = generateCommandString(builderConfig);

  return (
    <Card withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={6}>Stream Configuration</Title>
          <Group gap="xs">
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconUpload size={14} />}
              onClick={handleImportProfile}
            >
              Import
            </Button>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={handleExportProfile}
            >
              Export
            </Button>
          </Group>
        </Group>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileSelect}
        />

        <Tabs value={mode} onChange={(value) => setMode(value as 'builder' | 'raw')}>
          <Tabs.List>
            <Tabs.Tab value="builder">Form Builder</Tabs.Tab>
            <Tabs.Tab value="raw">Raw Command</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="builder" pt="md">
            <Stack gap="md">
              {/* Input Stream */}
              <div>
                <Group gap="xs" mb="xs">
                  <Text size="sm" fw={600}>
                    Input Stream
                  </Text>
                  <ActionIcon variant="subtle" size="xs" disabled>
                    <IconInfoCircle size={14} />
                  </ActionIcon>
                </Group>

                <Stack gap="sm">
                  <Select
                    label="Type"
                    value={builderConfig.input.type}
                    onChange={(value) => handleInputTypeChange(value as StreamType)}
                    data={[
                      { value: 'serial', label: 'Serial Port' },
                      { value: 'tcpcli', label: 'TCP Client' },
                      { value: 'tcpsvr', label: 'TCP Server' },
                      { value: 'ntripcli', label: 'NTRIP Client' },
                      { value: 'file', label: 'File' },
                    ]}
                  />

                  {renderInputFields(builderConfig.input, handleInputChange)}
                </Stack>
              </div>

              <Divider />

              {/* Output Streams */}
              <div>
                <Group gap="xs" mb="xs" justify="space-between">
                  <Group gap="xs">
                    <Text size="sm" fw={600}>
                      Output Streams
                    </Text>
                    <ActionIcon variant="subtle" size="xs" disabled>
                      <IconInfoCircle size={14} />
                    </ActionIcon>
                  </Group>
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="sm"
                    onClick={handleOutputAdd}
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Group>

                {builderConfig.outputs.length === 0 && (
                  <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
                    At least one output stream is required
                  </Alert>
                )}

                <Stack gap="md">
                  {builderConfig.outputs.map((output, index) => (
                    <Card key={output.id} withBorder padding="sm">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text size="sm" fw={500}>
                            Output #{index + 1}
                          </Text>
                          {builderConfig.outputs.length > 1 && (
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              onClick={() => handleOutputRemove(output.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>

                        <Select
                          label="Type"
                          value={output.type}
                          onChange={(value) =>
                            handleOutputTypeChange(output.id, value as StreamType)
                          }
                          data={[
                            { value: 'serial', label: 'Serial Port' },
                            { value: 'tcpcli', label: 'TCP Client' },
                            { value: 'tcpsvr', label: 'TCP Server' },
                            { value: 'ntripcli', label: 'NTRIP Client' },
                            { value: 'file', label: 'File' },
                          ]}
                        />

                        {renderOutputFields(
                          output,
                          (field, value) => handleOutputChange(output.id, field, value)
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </div>

              {/* Command Preview */}
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Command Preview
                </Text>
                <Code block style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  {commandPreview}
                </Code>
              </div>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="raw" pt="md">
            <Stack gap="md">
              <Textarea
                label="Raw Command Arguments"
                description="Enter str2str command line arguments directly"
                placeholder="-in serial://ttyUSB0:115200 -out file:///workspace/output.ubx"
                value={rawCommand}
                onChange={(e) => setRawCommand(e.currentTarget.value)}
                minRows={6}
                autosize
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  },
                }}
              />

              <Alert color="blue" icon={<IconInfoCircle size={16} />}>
                When in Raw mode, this command string takes precedence over the Form Builder
                configuration.
              </Alert>

              <div>
                <Text size="xs" c="dimmed" mb="xs">
                  Examples:
                </Text>
                <Code block style={{ fontSize: '11px' }}>
                  {`# Serial to file
-in serial://ttyUSB0:115200 -out file:///workspace/out_%Y%m%d.ubx

# TCP client to file
-in tcpcli://192.168.1.100:2101 -out file:///workspace/out.ubx

# NTRIP to file and TCP server
-in ntrip://user:pass@rtk2go.com:2101/MOUNT -out file:///workspace/out.rtcm -out tcpsvr://:5000`}
                </Code>
              </div>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  );
}

function renderInputFields(
  input: InputStream,
  onChange: (field: string, value: any) => void
) {
  const params = input.params;

  switch (input.type) {
    case 'serial': {
      const p = params as SerialParams;
      return (
        <>
          <TextInput
            label="Port"
            placeholder="/dev/ttyUSB0"
            value={p.port}
            onChange={(e) => onChange('port', e.currentTarget.value)}
          />
          <NumberInput
            label="Baudrate"
            value={p.baudrate}
            onChange={(value) => onChange('baudrate', value)}
            min={1200}
            max={921600}
          />
          <Group grow>
            <Select
              label="Byte Size"
              value={String(p.bytesize || 8)}
              onChange={(value) => onChange('bytesize', parseInt(value!))}
              data={[
                { value: '7', label: '7' },
                { value: '8', label: '8' },
              ]}
            />
            <Select
              label="Parity"
              value={p.parity || 'N'}
              onChange={(value) => onChange('parity', value)}
              data={[
                { value: 'N', label: 'None' },
                { value: 'E', label: 'Even' },
                { value: 'O', label: 'Odd' },
              ]}
            />
            <Select
              label="Stop Bits"
              value={String(p.stopbits || 1)}
              onChange={(value) => onChange('stopbits', parseInt(value!))}
              data={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
              ]}
            />
          </Group>
        </>
      );
    }
    case 'tcpcli': {
      const p = params as TcpClientParams;
      return (
        <>
          <TextInput
            label="Host"
            placeholder="192.168.1.100"
            value={p.host}
            onChange={(e) => onChange('host', e.currentTarget.value)}
          />
          <NumberInput
            label="Port"
            value={p.port}
            onChange={(value) => onChange('port', value)}
            min={1}
            max={65535}
          />
        </>
      );
    }
    case 'tcpsvr': {
      const p = params as TcpServerParams;
      return (
        <NumberInput
          label="Port"
          value={p.port}
          onChange={(value) => onChange('port', value)}
          min={1}
          max={65535}
        />
      );
    }
    case 'ntripcli': {
      const p = params as NtripClientParams;
      return (
        <>
          <TextInput
            label="Host"
            placeholder="rtk2go.com"
            value={p.host}
            onChange={(e) => onChange('host', e.currentTarget.value)}
          />
          <NumberInput
            label="Port"
            value={p.port}
            onChange={(value) => onChange('port', value)}
            min={1}
            max={65535}
          />
          <TextInput
            label="Mountpoint"
            placeholder="MOUNT"
            value={p.mountpoint}
            onChange={(e) => onChange('mountpoint', e.currentTarget.value)}
          />
          <TextInput
            label="Username (optional)"
            placeholder="username"
            value={p.username || ''}
            onChange={(e) => onChange('username', e.currentTarget.value)}
          />
          <PasswordInput
            label="Password (optional)"
            placeholder="password"
            value={p.password || ''}
            onChange={(e) => onChange('password', e.currentTarget.value)}
          />
        </>
      );
    }
    case 'file': {
      const p = params as FileParams;
      return (
        <TextInput
          label="File Path"
          placeholder="/workspace/input.ubx"
          value={p.path}
          onChange={(e) => onChange('path', e.currentTarget.value)}
          rightSection={
            <FileNamingHelper
              onKeywordClick={(keyword) => {
                const input = document.activeElement as HTMLInputElement;
                if (input && input.type === 'text') {
                  const start = input.selectionStart || p.path.length;
                  const newValue =
                    p.path.slice(0, start) + keyword + p.path.slice(start);
                  onChange('path', newValue);
                }
              }}
            />
          }
        />
      );
    }
  }
}

function renderOutputFields(
  output: OutputStream,
  onChange: (field: string, value: any) => void
) {
  const params = output.params;

  switch (output.type) {
    case 'serial': {
      const p = params as SerialParams;
      return (
        <>
          <TextInput
            label="Port"
            placeholder="/dev/ttyUSB1"
            value={p.port}
            onChange={(e) => onChange('port', e.currentTarget.value)}
          />
          <NumberInput
            label="Baudrate"
            value={p.baudrate}
            onChange={(value) => onChange('baudrate', value)}
            min={1200}
            max={921600}
          />
        </>
      );
    }
    case 'tcpcli': {
      const p = params as TcpClientParams;
      return (
        <>
          <TextInput
            label="Host"
            placeholder="192.168.1.100"
            value={p.host}
            onChange={(e) => onChange('host', e.currentTarget.value)}
          />
          <NumberInput
            label="Port"
            value={p.port}
            onChange={(value) => onChange('port', value)}
            min={1}
            max={65535}
          />
        </>
      );
    }
    case 'tcpsvr': {
      const p = params as TcpServerParams;
      return (
        <NumberInput
          label="Port"
          value={p.port}
          onChange={(value) => onChange('port', value)}
          min={1}
          max={65535}
        />
      );
    }
    case 'ntripcli': {
      const p = params as NtripClientParams;
      return (
        <>
          <TextInput
            label="Host"
            placeholder="rtk2go.com"
            value={p.host}
            onChange={(e) => onChange('host', e.currentTarget.value)}
          />
          <NumberInput
            label="Port"
            value={p.port}
            onChange={(value) => onChange('port', value)}
            min={1}
            max={65535}
          />
          <TextInput
            label="Mountpoint"
            placeholder="MOUNT"
            value={p.mountpoint}
            onChange={(e) => onChange('mountpoint', e.currentTarget.value)}
          />
        </>
      );
    }
    case 'file': {
      const p = params as FileParams;
      return (
        <TextInput
          label="File Path"
          placeholder="/workspace/output.ubx"
          value={p.path}
          onChange={(e) => onChange('path', e.currentTarget.value)}
          rightSection={
            <FileNamingHelper
              onKeywordClick={(keyword) => {
                const input = document.activeElement as HTMLInputElement;
                if (input && input.type === 'text') {
                  const start = input.selectionStart || p.path.length;
                  const newValue =
                    p.path.slice(0, start) + keyword + p.path.slice(start);
                  onChange('path', newValue);
                }
              }}
            />
          }
        />
      );
    }
  }
}
