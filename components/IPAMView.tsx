import React, { useState } from 'react';
import { Subnet, IPAddress } from '../types.ts';

interface IPAMViewProps {
  subnets: Subnet[];
  setSubnets: React.Dispatch<React.SetStateAction<Subnet[]>>;
  ipAddresses: IPAddress[];
  setIpAddresses: React.Dispatch<React.SetStateAction<IPAddress[]>>;
}

const IPAMView: React.FC<IPAMViewProps> = ({ subnets, setSubnets, ipAddresses, setIpAddresses }) => {
  const [isAddingSubnet, setIsAddingSubnet] = useState(false);
  const [selectedSubnetId, setSelectedSubnetId] = useState<string | null>(null);
  const [isAddingIp, setIsAddingIp] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editSubnetId, setEditSubnetId] = useState<string | null>(null);
  
  const [newSubnet, setNewSubnet] = useState<Partial<Subnet>>({
    name: '', cidr: '', gateway: '', description: '', vlanId: '', dhcpEnabled: false, dhcpStart: '', dhcpEnd: ''
  });

  const [newIp, setNewIp] = useState<Partial<IPAddress>>({
    address: '', hostname: '', mac: '', status: 'active', owner: ''
  });

  const selectedSubnet = subnets.find(s => s.id === selectedSubnetId);
  const filteredIps = ipAddresses.filter(ip => ip.subnetId === selectedSubnetId);

  const handleScanSubnet = async () => {
    if (!selectedSubnetId || !selectedSubnet) return;
    setIsScanning(true);
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidr: selectedSubnet.cidr })
      });

      if (!response.ok) throw new Error('Scan failed');
      
      const { aliveHosts } = await response.json();
      const timestamp = new Date().toLocaleTimeString();

      const updatedIps = ipAddresses.map(ip => {
        if (ip.subnetId === selectedSubnetId) {
          return {
            ...ip,
            isOnline: aliveHosts.includes(ip.address),
            lastChecked: timestamp
          };
        }
        return ip;
      });

      setIpAddresses(updatedIps);
    } catch (err) {
      console.error("Discovery error:", err);
      alert("Network scan failed. Ensure 'fping' is installed on the host.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddSubnet = () => {
    if (newSubnet.name && newSubnet.cidr) {
      if (editSubnetId) {
        // Edit existing subnet
        setSubnets(subnets.map(s => s.id === editSubnetId ? {
          ...s,
          ...newSubnet,
          vlanId: newSubnet.vlanNumber ? String(newSubnet.vlanNumber) : '',
          vlanName: newSubnet.vlanName || '',
          vlanDescription: newSubnet.vlanDescription || '',
        } : s));
        setEditSubnetId(null);
      } else {
        // Add new subnet
        const added: Subnet = {
          id: Math.random().toString(36).substr(2, 9),
          name: newSubnet.name || 'Unnamed',
          cidr: newSubnet.cidr || '',
          gateway: newSubnet.gateway || '',
          vlanId: newSubnet.vlanNumber ? String(newSubnet.vlanNumber) : '',
          vlanName: newSubnet.vlanName || '',
          vlanDescription: newSubnet.vlanDescription || '',
          description: newSubnet.description || '',
          usedIps: 0,
          totalIps: 254,
          dhcpEnabled: newSubnet.dhcpEnabled || false,
          dhcpStart: newSubnet.dhcpStart,
          dhcpEnd: newSubnet.dhcpEnd
        };
        setSubnets([...subnets, added]);
      }
      setNewSubnet({ name: '', cidr: '', gateway: '', description: '', vlanId: '', vlanName: '', vlanNumber: '', vlanDescription: '', dhcpEnabled: false, dhcpStart: '', dhcpEnd: '' });
      setIsAddingSubnet(false);
    }
  };

  const handleAddIp = () => {
    if (selectedSubnetId && newIp.address && newIp.hostname) {
      const added: IPAddress = {
        id: Math.random().toString(36).substr(2, 9),
        subnetId: selectedSubnetId,
        address: newIp.address || '',
        hostname: newIp.hostname || '',
        mac: newIp.mac || '',
        status: (newIp.status as any) || 'active',
        owner: newIp.owner || '',
        isOnline: true,
        lastChecked: new Date().toLocaleTimeString()
      };
      setIpAddresses([...ipAddresses, added]);
      setSubnets(subnets.map(s => s.id === selectedSubnetId ? { ...s, usedIps: s.usedIps + 1 } : s));
      setNewIp({ address: '', hostname: '', mac: '', status: 'active', owner: '' });
      setIsAddingIp(false);
    }
  };

  const deleteSubnet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubnets(subnets.filter(s => s.id !== id));
    setIpAddresses(ipAddresses.filter(ip => ip.subnetId !== id));
    if (selectedSubnetId === id) setSelectedSubnetId(null);
  };

  const deleteIp = (id: string) => {
    setIpAddresses(ipAddresses.filter(ip => ip.id !== id));
    if (selectedSubnetId) {
      setSubnets(subnets.map(s => s.id === selectedSubnetId ? { ...s, usedIps: Math.max(0, s.usedIps - 1) } : s));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'static': return 'bg-purple-900 text-purple-300 border-purple-700';
      case 'reserved': return 'bg-amber-900 text-amber-300 border-amber-700';
      case 'dhcp': return 'bg-blue-900 text-blue-300 border-blue-700';
      default: return 'bg-green-900 text-green-300 border-green-700';
    }
  };

  if (selectedSubnetId && selectedSubnet) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSelectedSubnetId(null)}
              className="p-3 bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors text-slate-300 shadow-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="bg-slate-900/70 backdrop-blur-lg rounded-2xl px-6 py-4 shadow-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-extrabold text-slate-100 drop-shadow">{selectedSubnet.name}</h1>
                <span className="px-3 py-1 bg-slate-800 text-slate-300 font-mono text-base rounded-xl border border-slate-700">{selectedSubnet.cidr}</span>
              </div>
              <p className="text-slate-400 text-base mt-1">
                {selectedSubnet.dhcpEnabled ? (
                  <span className="text-amber-400 font-semibold">DHCP Range: {selectedSubnet.dhcpStart} - {selectedSubnet.dhcpEnd}</span>
                ) : (
                  <span className="text-slate-500">DHCP Disabled</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button 
                onClick={handleScanSubnet}
                disabled={isScanning}
                className={`px-5 py-3 border-2 rounded-2xl flex items-center space-x-2 font-bold shadow-md transition-all text-base ${
                  isScanning 
                  ? 'bg-slate-800/60 text-slate-400 cursor-not-allowed border-slate-700' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                <svg className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span>{isScanning ? 'Pinging...' : 'Scan Subnet'}</span>
              </button>
              <button 
                onClick={() => setIsAddingIp(true)}
                className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg hover:from-blue-600 hover:to-cyan-600 flex items-center space-x-2 text-base transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span>Track Device</span>
              </button>
          </div>
        </div>

        {isAddingIp && (
          <div className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-slate-800 animate-in slide-in-from-top duration-300">
            <h3 className="text-xl font-extrabold mb-4 text-slate-100 drop-shadow">Register New Device</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">IP Address</label>
                <input 
                  type="text" 
                  value={newIp.address} 
                  onChange={e => setNewIp({...newIp, address: e.target.value})}
                  placeholder="192.168.1.X"
                  className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hostname</label>
                <input 
                  type="text" 
                  value={newIp.hostname} 
                  onChange={e => setNewIp({...newIp, hostname: e.target.value})}
                  placeholder="e.g. SRV-01"
                  className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assignment Type</label>
                <select 
                  value={newIp.status}
                  onChange={e => setNewIp({...newIp, status: e.target.value as any})}
                  className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="active">Dynamic</option>
                  <option value="static">Static</option>
                  <option value="reserved">Reserved</option>
                  <option value="dhcp">DHCP Lease</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-4">
              <button onClick={() => setIsAddingIp(false)} className="px-5 py-3 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-all">Cancel</button>
              <button onClick={handleAddIp} className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all">Confirm</button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/80 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-800 overflow-hidden mt-8">
          <table className="w-full text-left">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Device / Hostname</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">MAC Address</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredIps.map(ip => (
                <tr key={ip.id} className="hover:bg-slate-800/60 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                      {ip.isOnline !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full relative ${ip.isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
                            {ip.isOnline && <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60"></div>}
                          </div>
                          <span className={`text-xs font-extrabold uppercase ${ip.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                            {ip.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-extrabold text-slate-500 uppercase">Unknown</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="font-extrabold text-slate-100">{ip.hostname}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-base text-blue-400 font-extrabold">{ip.address}</td>
                  <td className="px-6 py-5 font-mono text-sm text-slate-400">{ip.mac || '--'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(ip.status)}`}>
                      {ip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 italic">
                    {ip.lastChecked ? ip.lastChecked : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteIp(ip.id)}
                      className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">IPAM</h1>
          <p className="text-slate-400">Subnet management and device health monitoring.</p>
        </div>
        <button 
          onClick={() => setIsAddingSubnet(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Add Subnet</span>
        </button>
      </div>

      {isAddingSubnet && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-bold mb-4 text-slate-100">New Subnet Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subnet Name</label>
              <input 
                type="text" 
                value={newSubnet.name} 
                onChange={e => setNewSubnet({...newSubnet, name: e.target.value})}
                placeholder="e.g. WiFi-Clients"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CIDR Block</label>
              <input 
                type="text" 
                value={newSubnet.cidr} 
                onChange={e => setNewSubnet({...newSubnet, cidr: e.target.value})}
                placeholder="192.168.1.0/24"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">VLAN Name</label>
              <input
                type="text"
                value={newSubnet.vlanName || ''}
                onChange={e => setNewSubnet({...newSubnet, vlanName: e.target.value})}
                placeholder="e.g. Office VLAN"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">VLAN Number</label>
              <input
                type="number"
                value={newSubnet.vlanNumber || ''}
                onChange={e => setNewSubnet({...newSubnet, vlanNumber: e.target.value})}
                placeholder="e.g. 10"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">VLAN Description</label>
              <input
                type="text"
                value={newSubnet.vlanDescription || ''}
                onChange={e => setNewSubnet({...newSubnet, vlanDescription: e.target.value})}
                placeholder="Describe the VLAN"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-600"
              />
            </div>
            
            <div className="md:col-span-2 pt-4 border-t border-slate-800 mt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                   <h4 className="text-sm font-bold text-slate-100">DHCP Range Settings</h4>
                   <p className="text-xs text-slate-500">Configure address pool for automatic assignments.</p>
                </div>
                <button 
                  onClick={() => setNewSubnet({...newSubnet, dhcpEnabled: !newSubnet.dhcpEnabled})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newSubnet.dhcpEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newSubnet.dhcpEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              {newSubnet.dhcpEnabled && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Start IP</label>
                    <input 
                      type="text" 
                      value={newSubnet.dhcpStart} 
                      onChange={e => setNewSubnet({...newSubnet, dhcpStart: e.target.value})}
                      placeholder="192.168.1.100"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">End IP</label>
                    <input 
                      type="text" 
                      value={newSubnet.dhcpEnd} 
                      onChange={e => setNewSubnet({...newSubnet, dhcpEnd: e.target.value})}
                      placeholder="192.168.1.200"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => setIsAddingSubnet(false)} className="px-4 py-2 text-slate-400 hover:text-slate-300">Cancel</button>
            <button onClick={handleAddSubnet} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md">Confirm</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Subnet</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Address Space</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">DHCP Range</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usage</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
              {subnets.map(subnet => {
                const usagePercent = (subnet.usedIps / subnet.totalIps) * 100;
                return (
                  <tr 
                    key={subnet.id} 
                    onClick={() => setSelectedSubnetId(subnet.id)}
                    className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">{subnet.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{subnet.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-blue-400 font-bold">{subnet.cidr}</td>
                    <td className="px-6 py-4">
                      {subnet.dhcpEnabled ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-tighter">Enabled Pool</span>
                          <span className="text-xs font-mono text-slate-500">{subnet.dhcpStart} - {subnet.dhcpEnd}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-bold uppercase">Disabled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${usagePercent > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${usagePercent}%`}}></div>
                        </div>
                        <span className="text-xs font-medium text-slate-400">{subnet.usedIps}/{subnet.totalIps}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right flex space-x-2 justify-end">
                      <button onClick={() => {
                        setIsAddingSubnet(true);
                        setNewSubnet({ ...subnet });
                        setEditSubnetId(subnet.id);
                      }} className="p-2 text-slate-600 hover:text-indigo-400 transition-all" title="Edit Subnet">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={(e) => deleteSubnet(subnet.id, e)} className="p-2 text-slate-600 hover:text-red-400 transition-all" title="Delete Subnet">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IPAMView;