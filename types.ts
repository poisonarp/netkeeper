export enum View {
  DASHBOARD = 'DASHBOARD',
  IPAM = 'IPAM',
  VLAN = 'VLAN',
  NAT = 'NAT',
  WIFI = 'WIFI',
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

export interface IPAddress {
  id: string;
  address: string;
  subnetId: string;
  hostname: string;
  mac: string;
  status: 'active' | 'reserved' | 'static' | 'dhcp';
  owner: string;
  isOnline?: boolean;
  lastChecked?: string;
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
