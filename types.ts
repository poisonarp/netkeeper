export enum View {
  DASHBOARD = 'DASHBOARD',
  IPAM = 'IPAM',
  IP_SCAN = 'IP_SCAN',
  VLAN = 'VLAN',
  NAT = 'NAT',
  WIFI = 'WIFI',
  MONITORING = 'MONITORING',
  DIAGRAM = 'DIAGRAM',
  DOCS = 'DOCS',
  SETTINGS = 'SETTINGS',
  APPLICATIONS = 'APPLICATIONS',
}

export interface Application {
  id: string;
  name: string;
  url: string;
  description?: string;
  host?: string;
}

// Removed duplicate View enum

export interface Subnet {
  id: string;
  name: string;
  cidr: string;
  gateway: string;
  vlanId?: string;
  vlanName?: string;
  vlanDescription?: string;
  description: string;
  usedIps: number;
  totalIps: number;
  dhcpEnabled: boolean;
  dhcpStart?: string;
  dhcpEnd?: string;
}

export type DeviceType = 'router' | 'switch' | 'firewall' | 'server' | 'desktop' | 'laptop' | 'phone' | 'iot' | 'printer' | 'camera' | 'ap' | 'nas' | 'vm' | 'container' | 'unknown';

export interface IPAddress {
  id: string;
  address: string;
  subnetId: string;
  hostname: string;
  mac: string;
  status: 'active' | 'reserved' | 'static' | 'dhcp';
  owner: string;
  notes?: string;
  isOnline?: boolean;
  lastChecked?: string;
  monitorEnabled?: boolean;
  deviceType?: DeviceType;
  parentDeviceId?: string; // ID of the device this connects to (e.g., switch, router)
  connectionType?: 'wired' | 'wireless';
}

export interface VLAN {
  id: string;
  vlanNumber: number;
  name: string;
  description: string;
  subnets: string[];
}

export interface NATRule {
  id: string;
  internalIp: string;
  externalIp: string;
  internalPort?: number;
  externalPort?: number;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  description: string;
}

export interface WiFiNetwork {
  id: string;
  ssid: string;
  password?: string;
  security: 'WPA2-PSK' | 'WPA3-SAE' | 'Enterprise' | 'Open';
  band: '2.4GHz' | '5GHz' | '6GHz' | 'Dual' | 'Tri';
  vlanId?: string;
  description: string;
  isActive: boolean;
}

export interface NetworkDoc {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface Notification {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface MonitoredDevice {
  id: string;
  ipAddress: string;
  hostname: string;
  status: 'online' | 'offline' | 'warning';
  latency: number;
  lastSeen: string;
  uptimePercent: number;
  checkInterval: number;
  enabled: boolean;
}

export interface MonitoringStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  averageLatency: number;
  lastCheck: string;
}

// Notification Provider Configurations
export interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  toAddresses: string[];
}

export interface DiscordConfig {
  enabled: boolean;
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
  mentionRoleId?: string;
}

export interface GotifyConfig {
  enabled: boolean;
  serverUrl: string;
  appToken: string;
  priority: number; // 1-10
}

export interface NtfyConfig {
  enabled: boolean;
  serverUrl: string;
  topic: string;
  username?: string;
  password?: string;
  priority: 1 | 2 | 3 | 4 | 5; // min, low, default, high, urgent
}

export interface NotificationSettings {
  smtp: SMTPConfig;
  discord: DiscordConfig;
  gotify: GotifyConfig;
  ntfy: NtfyConfig;
  alertOnOffline: boolean;
  alertOnBackOnline: boolean;
  alertOnHighLatency: boolean;
  highLatencyThreshold: number;
  cooldownMinutes: number; // prevent spam
}
