import React, { useState, useEffect } from 'react';
import { View, Subnet, VLAN, NATRule, IPAddress, WiFiNetwork, Application, Notification } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import IPAMView from './components/IPAMView.tsx';
import IPScanView from './components/IPScanView.tsx';
import VLANView from './components/VLANView.tsx';
import NATView from './components/NATView.tsx';
import WiFiView from './components/WiFiView.tsx';
import DiagramView from './components/DiagramView.tsx';
import DocsView from './components/DocsView.tsx';
import ApplicationsView from './components/ApplicationsView.tsx';
import SettingsView from './components/SettingsView.tsx';
import NetworkMonitoringView from './components/NetworkMonitoringView.tsx';
import Login from './components/Login.tsx';

const API_URL = '/api/data';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline' | 'syncing'>('syncing');
  
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [natRules, setNatRules] = useState<NATRule[]>([]);
  const [ipAddresses, setIpAddresses] = useState<IPAddress[]>([]);
  const [wifiNetworks, setWifiNetworks] = useState<WiFiNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Auth Initialization
  useEffect(() => {
    const session = localStorage.getItem('nk_session');
    if (session === 'active') {
      setIsAuthenticated(true);
    }
    
    // Default creds if none exist
    if (!localStorage.getItem('nk_admin_user')) {
      localStorage.setItem('nk_admin_user', 'admin');
      localStorage.setItem('nk_admin_pass', 'admin');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Safety timeout to ensure loading screen doesn't hang forever
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn("Data loading timed out. Switching to local mode.");
          setIsLoading(false);
          setDbStatus('offline');
        }
      }, 3000);

      try {
        const response = await fetch(API_URL).catch(() => null);
        if (response && response.ok) {
          const data = await response.json();
          
          // Transform backend data to frontend format
          setSubnets((data.subnets || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            cidr: s.cidr,
            gateway: s.gateway,
            vlanId: s.vlan,
            vlanName: '',
            vlanDescription: '',
            description: s.description,
            usedIps: 0,
            totalIps: 254,
            dhcpEnabled: false,
            dhcpStart: '',
            dhcpEnd: ''
          })));
          
          setVlans((data.vlans || []).map((v: any) => ({
            id: v.id,
            vlanNumber: 0,
            name: v.name,
            description: v.description,
            subnets: []
          })));
          
          setIpAddresses((data.ipAddresses || []).map((ip: any) => ({
            id: ip.id,
            address: ip.ip,
            subnetId: ip.subnetId,
            hostname: ip.hostname,
            mac: ip.macAddress || '',
            status: ip.status,
            owner: ip.deviceType || '',
            notes: ip.notes,
            isOnline: undefined,
            lastChecked: ip.lastSeen,
            monitorEnabled: false
          })));
          
          setNatRules(data.natRules || []);
          setApplications(data.applications || []);
          
          setWifiNetworks((data.wifiNetworks || []).map((w: any) => ({
            id: w.id,
            ssid: w.ssid,
            password: w.password,
            security: w.security,
            band: w.band,
            vlanId: w.vlan,
            description: '',
            isActive: Boolean(w.enabled)
          })));
          
          setDbStatus('connected');
        } else {
          throw new Error('Backend not available');
        }
      } catch (error) {
        setDbStatus('offline');
        const tryParse = (key: string) => {
          try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
          } catch (e) {
            return null;
          }
        };

        setSubnets(tryParse('subnets') || []);
        setVlans(tryParse('vlans') || []);
        setIpAddresses(tryParse('ipAddresses') || []);
        setWifiNetworks(tryParse('wifiNetworks') || []);
        setNatRules(tryParse('natRules') || []);
        setApplications(tryParse('applications') || []);
      } finally {
        clearTimeout(timeoutId);
        // Ensure the loading screen clears
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const saveData = async () => {
      // Save to localStorage first (instant backup)
      localStorage.setItem('subnets', JSON.stringify(subnets));
      localStorage.setItem('vlans', JSON.stringify(vlans));
      localStorage.setItem('ipAddresses', JSON.stringify(ipAddresses));
      localStorage.setItem('wifiNetworks', JSON.stringify(wifiNetworks));
      localStorage.setItem('natRules', JSON.stringify(natRules));
      localStorage.setItem('applications', JSON.stringify(applications));
      
      // Save to backend database
      if (dbStatus === 'connected') {
        try {
          // Transform frontend data to backend format
          const backendData = {
            subnets: subnets.map(s => ({
              id: s.id,
              name: s.name,
              cidr: s.cidr,
              gateway: s.gateway,
              vlan: s.vlanId || s.vlanNumber || '',
              description: s.description
            })),
            vlans: vlans.map(v => ({
              id: v.id,
              name: v.name,
              description: v.description
            })),
            ipAddresses: ipAddresses.map(ip => ({
              id: ip.id,
              ip: ip.address,
              hostname: ip.hostname,
              deviceType: ip.owner || '',
              status: ip.status,
              subnetId: ip.subnetId,
              macAddress: ip.mac,
              notes: ip.notes,
              lastSeen: ip.lastChecked
            })),
            natRules: natRules,
            wifiNetworks: wifiNetworks.map(w => ({
              id: w.id,
              ssid: w.ssid,
              security: w.security,
              password: w.password || '',
              channel: 0,
              band: w.band,
              vlan: w.vlanId || '',
              enabled: w.isActive ? 1 : 0
            })),
            applications: applications
          };
          
          await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendData)
          });
        } catch (error) {
          console.error('Failed to save to backend:', error);
        }
      }
    };
    
    saveData();
  }, [subnets, vlans, ipAddresses, wifiNetworks, natRules, applications, isLoading, dbStatus]);

  // Check if we should show welcome message
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const hideWelcome = localStorage.getItem('nk_hide_welcome');
      if (!hideWelcome && subnets.length === 0) {
        setShowWelcome(true);
      }
    }
  }, [isLoading, isAuthenticated, subnets.length]);

  // Device monitoring - check every 3 minutes
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const checkMonitoredDevices = async () => {
      const monitoredDevices = ipAddresses.filter(ip => ip.monitorEnabled);
      
      if (monitoredDevices.length === 0) return;

      try {
        const response = await fetch('/api/monitor/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            devices: monitoredDevices.map(d => ({
              id: d.id,
              address: d.address,
              hostname: d.hostname,
              wasOnline: d.isOnline
            }))
          })
        });

        if (!response.ok) return;

        const { results } = await response.json();
        const timestamp = new Date().toLocaleTimeString();
        
        // Update device status
        const updatedIps = ipAddresses.map(ip => {
          const result = results.find((r: any) => r.id === ip.id);
          if (result) {
            return {
              ...ip,
              isOnline: result.isOnline,
              lastChecked: timestamp
            };
          }
          return ip;
        });
        
        setIpAddresses(updatedIps);

        // Create notifications for offline devices
        const newNotifications: Notification[] = [];
        results.forEach((result: any) => {
          const device = monitoredDevices.find(d => d.id === result.id);
          if (device && result.wasOnline && !result.isOnline) {
            // Device went offline
            newNotifications.push({
              id: Math.random().toString(36).substr(2, 9),
              deviceId: device.id,
              deviceName: device.hostname,
              ipAddress: device.address,
              message: `${device.hostname} (${device.address}) is offline`,
              timestamp: new Date().toISOString(),
              read: false
            });
          }
        });

        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
        }
      } catch (error) {
        console.error('Monitoring check failed:', error);
      }
    };

    // Check immediately on mount
    checkMonitoredDevices();

    // Then check every 3 minutes (180000ms)
    const interval = setInterval(checkMonitoredDevices, 180000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, ipAddresses]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleLogin = (u: string, p: string) => {
    const storedU = localStorage.getItem('nk_admin_user');
    const storedP = localStorage.getItem('nk_admin_pass');
    
    if (u === storedU && p === storedP) {
      setIsAuthenticated(true);
      localStorage.setItem('nk_session', 'active');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nk_session');
    setCurrentView(View.DASHBOARD);
  };

  const updateAuth = (u: string, p: string) => {
    localStorage.setItem('nk_admin_user', u);
    localStorage.setItem('nk_admin_pass', p);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-blue-500 font-medium">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="animate-pulse">Loading Infrastructure Workspace...</p>
        </div>
      </div>
    ); 
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard subnets={subnets} vlans={vlans} natRules={natRules} />;
      case View.IPAM:
        return <IPAMView subnets={subnets} setSubnets={setSubnets} ipAddresses={ipAddresses} setIpAddresses={setIpAddresses} />;
      case View.IP_SCAN:
        return <IPScanView subnets={subnets} setSubnets={setSubnets} ipAddresses={ipAddresses} setIpAddresses={setIpAddresses} />;
      case View.VLAN:
        return <VLANView subnets={subnets} />;
      case View.NAT:
        return <NATView natRules={natRules} setNatRules={setNatRules} />;
      case View.WIFI:
        return <WiFiView wifiNetworks={wifiNetworks} setWifiNetworks={setWifiNetworks} />;
      case View.MONITORING:
        return <NetworkMonitoringView ipAddresses={ipAddresses} />;
      case View.DIAGRAM:
        return <DiagramView subnets={subnets} ipAddresses={ipAddresses} setIpAddresses={setIpAddresses} />;
      case View.DOCS:
        return <DocsView />;
      case View.APPLICATIONS:
        return <ApplicationsView applications={applications} setApplications={setApplications} ipAddresses={ipAddresses} />;
      case View.SETTINGS:
        return <SettingsView onUpdateAuth={updateAuth} />;
      default:
        return <Dashboard subnets={subnets} vlans={vlans} natRules={natRules} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-100 bg-slate-950 animate-in fade-in duration-500">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg mx-4 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Welcome to NetKeeper Pro</h2>
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-blue-400">Getting Started:</strong> Please start by adding a <strong className="text-slate-100">Subnet in IPAM</strong> first in order to utilize VLANs, IP Scanning, and adding devices.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  onChange={(e) => {
                    if (e.target.checked) {
                      localStorage.setItem('nk_hide_welcome', 'true');
                    }
                  }}
                />
                Don't show this again
              </label>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWelcome(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowWelcome(false);
                    setCurrentView(View.IPAM);
                  }}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  Go to IPAM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        dbStatus={dbStatus} 
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onOpenSettings={() => setCurrentView(View.SETTINGS)}
          notifications={notifications}
          onMarkNotificationRead={markNotificationAsRead}
          onClearNotifications={clearAllNotifications}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;