import React, { useState, useEffect } from 'react';
import { View, Subnet, VLAN, NATRule, IPAddress, WiFiNetwork, Application } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import IPAMView from './components/IPAMView.tsx';
import VLANView from './components/VLANView.tsx';
import NATView from './components/NATView.tsx';
import WiFiView from './components/WiFiView.tsx';
import DiagramView from './components/DiagramView.tsx';
import DocsView from './components/DocsView.tsx';
import ApplicationsView from './components/ApplicationsView.tsx';
import SettingsView from './components/SettingsView.tsx';
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
          setSubnets(data.subnets || []);
          setVlans(data.vlans || []);
          setNatRules(data.natRules || []);
          setApplications(data.applications || []);
          setIpAddresses(data.ipAddresses || []);
          setWifiNetworks(data.wifiNetworks || []);
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
    const saveToLocal = () => {
      localStorage.setItem('subnets', JSON.stringify(subnets));
      localStorage.setItem('vlans', JSON.stringify(vlans));
      localStorage.setItem('ipAddresses', JSON.stringify(ipAddresses));
      localStorage.setItem('wifiNetworks', JSON.stringify(wifiNetworks));
      localStorage.setItem('natRules', JSON.stringify(natRules));
      localStorage.setItem('applications', JSON.stringify(applications));
    };
    saveToLocal();
  }, [subnets, vlans, ipAddresses, wifiNetworks, natRules, applications, isLoading]);

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
      case View.VLAN:
        return <VLANView subnets={subnets} />;
      case View.NAT:
        return <NATView natRules={natRules} setNatRules={setNatRules} />;
      case View.WIFI:
        return <WiFiView wifiNetworks={wifiNetworks} setWifiNetworks={setWifiNetworks} />;
      case View.DIAGRAM:
        return <DiagramView subnets={subnets} />;
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
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        dbStatus={dbStatus} 
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSettings={() => setCurrentView(View.SETTINGS)} />
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