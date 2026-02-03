import React, { useState } from 'react';
import { Subnet, IPAddress } from '../types.ts';

interface IPScanViewProps {
  subnets: Subnet[];
  setSubnets: React.Dispatch<React.SetStateAction<Subnet[]>>;
  ipAddresses: IPAddress[];
  setIpAddresses: React.Dispatch<React.SetStateAction<IPAddress[]>>;
}

interface ScannedDevice {
  ip: string;
  isOnline: boolean;
  hostname?: string;
  mac?: string;
}

const IPScanView: React.FC<IPScanViewProps> = ({ subnets, setSubnets, ipAddresses, setIpAddresses }) => {
  const [selectedSubnetId, setSelectedSubnetId] = useState<string>('');
  const [customCidr, setCustomCidr] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScannedDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [scanProgress, setScanProgress] = useState<number>(0);

  const selectedSubnet = subnets.find(s => s.id === selectedSubnetId);

  const handleScan = async () => {
    const cidrToScan = selectedSubnetId ? selectedSubnet?.cidr : customCidr;
    
    if (!cidrToScan) {
      alert('Please select a subnet or enter a CIDR range');
      return;
    }

    setIsScanning(true);
    setScanResults([]);
    setScanProgress(0);
    setSelectedDevices(new Set());

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidr: cidrToScan })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scan failed: ${response.status} - ${errorText}`);
      }
      
      const { aliveHosts } = await response.json();
      
      // Create scan results
      const results: ScannedDevice[] = aliveHosts.map((ip: string) => ({
        ip,
        isOnline: true,
        hostname: `host-${ip.split('.').pop()}`,
        mac: ''
      }));

      setScanResults(results);
      setScanProgress(100);
      
      if (results.length === 0) {
        alert(`Scan completed but no active hosts found in ${cidrToScan}`);
      }
    } catch (err) {
      console.error("Scan error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if it's a network error (backend not reachable)
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        alert(`Cannot reach backend server. Please ensure:\n1. The backend server is running (node server.js or docker compose up)\n2. The server is accessible at /api/scan\n3. Check browser console for details`);
      } else {
        alert(`Network scan failed: ${errorMessage}\n\nNote: Ensure 'fping' is installed on the host if running in Docker/Linux.`);
      }
      
      // Generate demo results for testing UI
      const [network] = (cidrToScan || '').split(/[./]/);
      if (network) {
        const demoResults: ScannedDevice[] = [
          { ip: `${network}.1.1.1`, isOnline: true, hostname: 'gateway', mac: '00:11:22:33:44:01' },
          { ip: `${network}.1.1.10`, isOnline: true, hostname: 'server-01', mac: '00:11:22:33:44:0A' },
          { ip: `${network}.1.1.20`, isOnline: true, hostname: 'workstation', mac: '00:11:22:33:44:14' },
        ];
        console.log('Using demo data for testing');
        setScanResults(demoResults);
      }
      setScanProgress(100);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleDeviceSelection = (ip: string) => {
    const newSelection = new Set(selectedDevices);
    if (newSelection.has(ip)) {
      newSelection.delete(ip);
    } else {
      newSelection.add(ip);
    }
    setSelectedDevices(newSelection);
  };

  const handleAddSelectedDevices = () => {
    if (!selectedSubnetId) {
      alert('Please select a subnet to add devices to');
      return;
    }

    const devicesToAdd = scanResults.filter(device => selectedDevices.has(device.ip));
    
    if (devicesToAdd.length === 0) {
      alert('Please select at least one device to add');
      return;
    }

    const newIpAddresses: IPAddress[] = devicesToAdd.map(device => ({
      id: Math.random().toString(36).substr(2, 9),
      subnetId: selectedSubnetId,
      address: device.ip,
      hostname: device.hostname || `host-${device.ip.split('.').pop()}`,
      mac: device.mac || '',
      status: 'active' as const,
      owner: 'Discovered via scan',
      isOnline: true,
      lastChecked: new Date().toLocaleTimeString()
    }));

    // Filter out IPs that already exist
    const existingIps = new Set(ipAddresses.filter(ip => ip.subnetId === selectedSubnetId).map(ip => ip.address));
    const uniqueNewIps = newIpAddresses.filter(ip => !existingIps.has(ip.address));

    if (uniqueNewIps.length === 0) {
      alert('All selected devices already exist in the subnet');
      return;
    }

    setIpAddresses([...ipAddresses, ...uniqueNewIps]);
    
    // Update subnet used IPs count
    setSubnets(subnets.map(s => 
      s.id === selectedSubnetId 
        ? { ...s, usedIps: s.usedIps + uniqueNewIps.length } 
        : s
    ));

    alert(`Successfully added ${uniqueNewIps.length} device(s) to ${selectedSubnet?.name}`);
    setSelectedDevices(new Set());
    setScanResults([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-slate-900/70 backdrop-blur-lg rounded-2xl px-6 py-4 shadow-xl border border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-100 drop-shadow">IP Network Scanner</h1>
        <p className="text-slate-400 text-base mt-1">Scan network ranges and add discovered devices to subnets</p>
      </div>

      {/* Scan Configuration */}
      <div className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-slate-800">
        <h3 className="text-xl font-extrabold mb-6 text-slate-100 drop-shadow">Scan Configuration</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Subnet</label>
            <select
              value={selectedSubnetId}
              onChange={(e) => {
                setSelectedSubnetId(e.target.value);
                setCustomCidr('');
              }}
              className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">-- Select a subnet --</option>
              {subnets.map(subnet => (
                <option key={subnet.id} value={subnet.id}>
                  {subnet.name} ({subnet.cidr})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Or Enter Custom CIDR</label>
            <input
              type="text"
              value={customCidr}
              onChange={(e) => {
                setCustomCidr(e.target.value);
                setSelectedSubnetId('');
              }}
              placeholder="e.g. 192.168.1.0/24"
              className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-600"
              disabled={!!selectedSubnetId}
            />
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={isScanning || (!selectedSubnetId && !customCidr)}
          className={`px-6 py-3 rounded-2xl flex items-center space-x-3 font-bold shadow-lg transition-all text-base ${
            isScanning || (!selectedSubnetId && !customCidr)
              ? 'bg-slate-800/60 text-slate-400 cursor-not-allowed border-2 border-slate-700'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-blue-600 hover:to-cyan-600'
          }`}
        >
          <svg className={`w-6 h-6 ${isScanning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{isScanning ? 'Scanning Network...' : 'Start Scan'}</span>
        </button>

        {isScanning && (
          <div className="mt-4">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 transition-all duration-300 animate-pulse"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="bg-slate-900/80 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-800 overflow-hidden">
          <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-100">Scan Results</h3>
              <p className="text-slate-400 text-sm mt-1">
                Found {scanResults.length} active device(s) | {selectedDevices.size} selected
              </p>
            </div>
            {selectedDevices.size > 0 && selectedSubnetId && (
              <button
                onClick={handleAddSelectedDevices}
                className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:from-emerald-600 hover:to-green-600 flex items-center space-x-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Selected to {selectedSubnet?.name}</span>
              </button>
            )}
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedDevices.size === scanResults.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDevices(new Set(scanResults.map(d => d.ip)));
                      } else {
                        setSelectedDevices(new Set());
                      }
                    }}
                    className="w-5 h-5 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-cyan-500"
                  />
                </th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Hostname</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">MAC Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {scanResults.map((device) => {
                const isSelected = selectedDevices.has(device.ip);
                const existsInSubnet = selectedSubnetId && ipAddresses.some(
                  ip => ip.subnetId === selectedSubnetId && ip.address === device.ip
                );

                return (
                  <tr 
                    key={device.ip}
                    className={`hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-cyan-900/20' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDeviceSelection(device.ip)}
                        disabled={!!existsInSubnet}
                        className="w-5 h-5 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        device.isOnline 
                          ? 'bg-green-900/50 text-green-300 border border-green-700' 
                          : 'bg-red-900/50 text-red-300 border border-red-700'
                      }`}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          device.isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                        }`}></span>
                        {device.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-100 font-mono font-semibold">{device.ip}</td>
                    <td className="px-6 py-4 text-slate-300">{device.hostname || '-'}</td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                      {device.mac || '-'}
                      {existsInSubnet && (
                        <span className="ml-2 px-2 py-1 bg-amber-900/50 text-amber-300 text-xs rounded border border-amber-700">
                          Already tracked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {scanResults.length === 0 && !isScanning && (
        <div className="bg-slate-900/80 backdrop-blur-lg p-12 rounded-3xl shadow-xl border border-slate-800 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-xl font-bold text-slate-400 mb-2">No scan results yet</h3>
          <p className="text-slate-500">Select a subnet or enter a CIDR range and click "Start Scan" to discover devices</p>
        </div>
      )}
    </div>
  );
};

export default IPScanView;
