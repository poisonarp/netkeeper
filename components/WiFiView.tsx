
import React, { useState } from 'react';
import { WiFiNetwork } from '../types.ts';

interface WiFiViewProps {
  wifiNetworks: WiFiNetwork[];
  setWifiNetworks: React.Dispatch<React.SetStateAction<WiFiNetwork[]>>;
}

const WiFiView: React.FC<WiFiViewProps> = ({ wifiNetworks, setWifiNetworks }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [newNet, setNewNet] = useState<Partial<WiFiNetwork>>({
    ssid: '', password: '', security: 'WPA2-PSK', band: 'Dual', description: '', isActive: true
  });

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = () => {
    if (newNet.ssid) {
      const added: WiFiNetwork = {
        id: Math.random().toString(36).substr(2, 9),
        ssid: newNet.ssid || 'New SSID',
        password: newNet.password,
        security: newNet.security as any || 'WPA2-PSK',
        band: newNet.band as any || 'Dual',
        description: newNet.description || '',
        isActive: true,
        vlanId: newNet.vlanId
      };
      setWifiNetworks([...wifiNetworks, added]);
      setNewNet({ ssid: '', password: '', security: 'WPA2-PSK', band: 'Dual', description: '', isActive: true });
      setIsAdding(false);
    }
  };

  const deleteWifi = (id: string) => {
    setWifiNetworks(wifiNetworks.filter(n => n.id !== id));
  };

  const toggleActive = (id: string) => {
    setWifiNetworks(wifiNetworks.map(n => n.id === id ? { ...n, isActive: !n.isActive } : n));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">WiFi Networks</h1>
          <p className="text-slate-400">Manage wireless access points and broadcasted SSIDs.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-600 shadow-lg shadow-cyan-900/20 flex items-center space-x-2 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Provision Network</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-cyan-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-bold mb-4 text-slate-100">New WiFi Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">SSID Name</label>
              <input 
                type="text" 
                value={newNet.ssid} 
                onChange={e => setNewNet({...newNet, ssid: e.target.value})}
                placeholder="Broadcast Name"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Security Mode</label>
              <select 
                value={newNet.security}
                onChange={e => setNewNet({...newNet, security: e.target.value as any})}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="WPA2-PSK">WPA2 Personal (PSK)</option>
                <option value="WPA3-SAE">WPA3 Personal (SAE)</option>
                <option value="Enterprise">Enterprise (RADIUS)</option>
                <option value="Open">Open</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Passphrase</label>
              <input 
                type="text" 
                value={newNet.password} 
                onChange={e => setNewNet({...newNet, password: e.target.value})}
                placeholder="WiFi Password"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Broadcast Band</label>
              <select 
                value={newNet.band}
                onChange={e => setNewNet({...newNet, band: e.target.value as any})}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="2.4GHz">2.4 GHz Only</option>
                <option value="5GHz">5 GHz Only</option>
                <option value="6GHz">6 GHz Only</option>
                <option value="Dual">Dual Band (2.4/5)</option>
                <option value="Tri">Tri Band (2.4/5/6)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assigned VLAN ID</label>
              <input 
                type="text" 
                value={newNet.vlanId} 
                onChange={e => setNewNet({...newNet, vlanId: e.target.value})}
                placeholder="e.g. 50"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
              <textarea 
                value={newNet.description} 
                onChange={e => setNewNet({...newNet, description: e.target.value})}
                placeholder="Purpose of this network..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none h-20"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-6 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-600 shadow-md font-bold transition-all active:scale-95">Deploy SSID</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {wifiNetworks.map(wifi => (
          <div key={wifi.id} className={`bg-slate-900 rounded-2xl border transition-all duration-300 p-6 relative overflow-hidden group shadow-sm hover:shadow-md ${wifi.isActive ? 'border-cyan-900' : 'border-slate-800 grayscale opacity-70'}`}>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${wifi.isActive ? 'bg-cyan-900 text-cyan-400' : 'bg-slate-800 text-slate-600'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.9 9.9 0 0114.142 0M2.006 8.854a15.356 15.356 0 0121.988 0" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{wifi.ssid}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{wifi.security}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">{wifi.band}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => toggleActive(wifi.id)}
                  className={`p-2 rounded-lg transition-colors ${wifi.isActive ? 'text-green-500 hover:bg-green-900' : 'text-slate-600 hover:bg-slate-800'}`}
                  title={wifi.isActive ? "Deactivate Broadcast" : "Activate Broadcast"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </button>
                <button 
                  onClick={() => deleteWifi(wifi.id)}
                  className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-900 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400 leading-relaxed min-h-[40px]">
              {wifi.description || "No description provided for this SSID."}
            </p>

            <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Network Key</label>
                <div className="flex items-center space-x-2 font-mono text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-100">
                  <span className="flex-1 truncate">
                    {showPasswords[wifi.id] ? (wifi.password || 'Open Network') : '••••••••••••'}
                  </span>
                  <button onClick={() => togglePassword(wifi.id)} className="text-slate-400 hover:text-cyan-500 transition-colors">
                    {showPasswords[wifi.id] ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">VLAN</label>
                <span className={`px-3 py-1.5 rounded-lg font-bold text-xs ${wifi.isActive ? 'bg-indigo-900 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                   {wifi.vlanId ? `ID ${wifi.vlanId}` : 'Native'}
                </span>
              </div>
            </div>

            {/* Decorative background pulse for active networks */}
            {wifi.isActive && (
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WiFiView;
