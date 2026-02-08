import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IPAddress, MonitoredDevice } from '../types.ts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  sendAlert, 
  createOfflineAlert, 
  createOnlineAlert, 
  createHighLatencyAlert,
  loadNotificationSettings 
} from '../services/notificationService.ts';

interface NetworkMonitoringViewProps {
  ipAddresses: IPAddress[];
}

interface LatencyHistory {
  time: string;
  latency: number;
}

interface DeviceWithMonitoring extends MonitoredDevice {
  latencyHistory: LatencyHistory[];
}

const NetworkMonitoringView: React.FC<NetworkMonitoringViewProps> = ({ ipAddresses }) => {
  const [monitoredDevices, setMonitoredDevices] = useState<DeviceWithMonitoring[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithMonitoring | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertsSent, setAlertsSent] = useState<number>(0);
  const previousStatusRef = useRef<Record<string, string>>({});

  // Initialize monitored devices from IP addresses
  useEffect(() => {
    const savedDevices = localStorage.getItem('monitoredDevices');
    if (savedDevices) {
      setMonitoredDevices(JSON.parse(savedDevices));
    } else {
      // Initialize from IP addresses
      const devices: DeviceWithMonitoring[] = ipAddresses.map(ip => ({
        id: ip.id,
        ipAddress: ip.address,
        hostname: ip.hostname || 'Unknown',
        status: ip.isOnline ? 'online' : 'offline',
        latency: Math.floor(Math.random() * 50) + 1,
        lastSeen: new Date().toISOString(),
        uptimePercent: 100,
        checkInterval: 30,
        enabled: true,
        latencyHistory: generateInitialHistory()
      }));
      setMonitoredDevices(devices);
    }
  }, [ipAddresses]);

  // Save monitored devices to localStorage
  useEffect(() => {
    if (monitoredDevices.length > 0) {
      localStorage.setItem('monitoredDevices', JSON.stringify(monitoredDevices));
    }
  }, [monitoredDevices]);

  function generateInitialHistory(): LatencyHistory[] {
    const history: LatencyHistory[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      history.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        latency: Math.floor(Math.random() * 30) + 5
      });
    }
    return history;
  }

  // Send notification alerts based on status changes
  const checkAndSendAlerts = useCallback(async (device: DeviceWithMonitoring, previousStatus: string) => {
    const settings = loadNotificationSettings();
    const currentStatus = device.status;
    
    // Check for status changes
    if (previousStatus !== currentStatus) {
      if (currentStatus === 'offline' && settings.alertOnOffline) {
        const alert = createOfflineAlert(device.hostname, device.ipAddress);
        const result = await sendAlert(device.id, alert, settings);
        if (result.success) {
          setAlertsSent(prev => prev + 1);
        }
      } else if (currentStatus === 'online' && previousStatus === 'offline' && settings.alertOnBackOnline) {
        const alert = createOnlineAlert(device.hostname, device.ipAddress);
        const result = await sendAlert(device.id, alert, settings);
        if (result.success) {
          setAlertsSent(prev => prev + 1);
        }
      }
    }
    
    // Check for high latency
    if (settings.alertOnHighLatency && device.latency > settings.highLatencyThreshold && currentStatus !== 'offline') {
      const alert = createHighLatencyAlert(device.hostname, device.ipAddress, device.latency);
      await sendAlert(device.id, alert, settings);
    }
  }, []);

  // Simulate network monitoring
  const runMonitoringCheck = useCallback(() => {
    setIsMonitoring(true);
    
    setTimeout(() => {
      setMonitoredDevices(prev => {
        const updatedDevices = prev.map(device => {
          if (!device.enabled) return device;
          
          // Store previous status for comparison
          const previousStatus = device.status;
          previousStatusRef.current[device.id] = previousStatus;
          
          // Simulate realistic behavior
          const wasOnline = device.status === 'online' || device.status === 'warning';
          const random = Math.random();
          
          // 95% chance to stay in same state, 5% chance to flip
          const isOnline = random > 0.05 ? wasOnline : !wasOnline;
          const hasWarning = isOnline && random > 0.9;
          
          const newLatency = isOnline 
            ? Math.floor(Math.random() * 40) + 5 
            : 0;
          
          const newHistory = [...device.latencyHistory.slice(1), {
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            latency: newLatency
          }];

          // Calculate uptime
          const onlineChecks = newHistory.filter(h => h.latency > 0).length;
          const uptimePercent = (onlineChecks / newHistory.length) * 100;

          const updatedDevice = {
            ...device,
            status: isOnline ? (hasWarning ? 'warning' : 'online') : 'offline',
            latency: newLatency,
            lastSeen: isOnline ? new Date().toISOString() : device.lastSeen,
            uptimePercent: Math.round(uptimePercent * 10) / 10,
            latencyHistory: newHistory
          } as DeviceWithMonitoring;

          // Check and send alerts for this device
          checkAndSendAlerts(updatedDevice, previousStatus);

          return updatedDevice;
        });
        
        return updatedDevices;
      });
      
      setLastRefresh(new Date());
      setIsMonitoring(false);
    }, 1500);
  }, [checkAndSendAlerts]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(runMonitoringCheck, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, runMonitoringCheck]);

  // Stats calculation
  const stats = {
    total: monitoredDevices.filter(d => d.enabled).length,
    online: monitoredDevices.filter(d => d.enabled && d.status === 'online').length,
    offline: monitoredDevices.filter(d => d.enabled && d.status === 'offline').length,
    warning: monitoredDevices.filter(d => d.enabled && d.status === 'warning').length,
    avgLatency: Math.round(
      monitoredDevices
        .filter(d => d.enabled && d.status !== 'offline')
        .reduce((acc, d) => acc + d.latency, 0) / 
      Math.max(1, monitoredDevices.filter(d => d.enabled && d.status !== 'offline').length)
    ),
    avgUptime: Math.round(
      monitoredDevices
        .filter(d => d.enabled)
        .reduce((acc, d) => acc + d.uptimePercent, 0) / 
      Math.max(1, monitoredDevices.filter(d => d.enabled).length) * 10
    ) / 10
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/10 border-green-500/30';
      case 'offline': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-amber-500/10 border-amber-500/30';
      default: return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  const toggleDeviceMonitoring = (deviceId: string) => {
    setMonitoredDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, enabled: !d.enabled } : d
    ));
  };

  // Aggregate latency data for overview chart
  const aggregateLatencyData = monitoredDevices.length > 0 
    ? monitoredDevices[0].latencyHistory.map((_, idx) => ({
        time: monitoredDevices[0].latencyHistory[idx].time,
        avgLatency: Math.round(
          monitoredDevices
            .filter(d => d.enabled)
            .reduce((acc, d) => acc + (d.latencyHistory[idx]?.latency || 0), 0) /
          Math.max(1, monitoredDevices.filter(d => d.enabled).length)
        )
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-400 drop-shadow">Network Monitoring</h1>
          <p className="text-cyan-500">Real-time device status and latency tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Auto-refresh</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoRefresh ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  autoRefresh ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
          </select>
          <button
            onClick={runMonitoringCheck}
            disabled={isMonitoring}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
          >
            {isMonitoring ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Checking...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-900/70 backdrop-blur-lg p-6 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Total Monitored</p>
          <h3 className="text-3xl font-bold text-cyan-400 mt-1">{stats.total}</h3>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-6 rounded-2xl border border-green-500/20">
          <p className="text-green-400 text-sm font-medium">Online</p>
          <h3 className="text-3xl font-bold text-green-400 mt-1">{stats.online}</h3>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-6 rounded-2xl border border-red-500/20">
          <p className="text-red-400 text-sm font-medium">Offline</p>
          <h3 className="text-3xl font-bold text-red-400 mt-1">{stats.offline}</h3>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-6 rounded-2xl border border-amber-500/20">
          <p className="text-amber-400 text-sm font-medium">Warning</p>
          <h3 className="text-3xl font-bold text-amber-400 mt-1">{stats.warning}</h3>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-6 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Avg Latency</p>
          <h3 className="text-3xl font-bold text-cyan-400 mt-1">{stats.avgLatency}<span className="text-lg ml-1">ms</span></h3>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-6 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Avg Uptime</p>
          <h3 className="text-3xl font-bold text-cyan-400 mt-1">{stats.avgUptime}<span className="text-lg ml-1">%</span></h3>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-6 rounded-2xl border border-purple-500/20">
          <p className="text-purple-400 text-sm font-medium">Alerts Sent</p>
          <h3 className="text-3xl font-bold text-purple-400 mt-1">{alertsSent}</h3>
        </div>
      </div>

      {/* Network Overview Chart */}
      <div className="bg-slate-900/70 backdrop-blur-lg p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Network Latency Overview</h3>
          {lastRefresh && (
            <span className="text-sm text-slate-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={aggregateLatencyData}>
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} unit="ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px'
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="avgLatency"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#latencyGradient)"
                name="Avg Latency"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device Grid and Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-2 bg-slate-900/70 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-cyan-400">Monitored Devices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Latency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Uptime</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {monitoredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No devices to monitor</p>
                      <p className="text-sm mt-1">Add IP addresses in IPAM to start monitoring</p>
                    </td>
                  </tr>
                ) : (
                  monitoredDevices.map(device => (
                    <tr
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      className={`cursor-pointer transition-colors hover:bg-slate-800/50 ${
                        selectedDevice?.id === device.id ? 'bg-slate-800/70' : ''
                      } ${!device.enabled ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full ${getStatusColor(device.status)} ${device.enabled ? 'animate-pulse' : ''}`} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-200">{device.hostname}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-400">{device.ipAddress}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm ${
                          device.status === 'offline' ? 'text-slate-600' :
                          device.latency > 100 ? 'text-red-400' :
                          device.latency > 50 ? 'text-amber-400' :
                          'text-green-400'
                        }`}>
                          {device.status === 'offline' ? '---' : `${device.latency}ms`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                device.uptimePercent >= 99 ? 'bg-green-500' :
                                device.uptimePercent >= 95 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${device.uptimePercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{device.uptimePercent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDeviceMonitoring(device.id);
                          }}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            device.enabled
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-cyan-600 text-white hover:bg-cyan-500'
                          }`}
                        >
                          {device.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Detail Panel */}
        <div className="bg-slate-900/70 backdrop-blur-lg rounded-2xl border border-slate-800 p-6">
          {selectedDevice ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-cyan-400">Device Details</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBgColor(selectedDevice.status)}`}>
                  {selectedDevice.status}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Hostname</p>
                  <p className="text-lg font-medium text-slate-200">{selectedDevice.hostname}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">IP Address</p>
                  <p className="font-mono text-slate-300">{selectedDevice.ipAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Current Latency</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {selectedDevice.status === 'offline' ? '---' : `${selectedDevice.latency}ms`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">30-Period Uptime</p>
                  <p className="text-2xl font-bold text-cyan-400">{selectedDevice.uptimePercent}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Last Seen</p>
                  <p className="text-sm text-slate-400">
                    {new Date(selectedDevice.lastSeen).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Device Latency Chart */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Latency History</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedDevice.latencyHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tick={false} />
                      <YAxis stroke="#64748b" fontSize={10} width={30} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="latency"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500">
              <svg className="w-16 h-16 mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-center">Select a device to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>Online</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Warning (High Latency)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Offline</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkMonitoringView;
