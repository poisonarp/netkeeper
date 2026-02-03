
import React, { useState } from 'react';

interface SettingsViewProps {
  onUpdateAuth: (user: string, pass: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onUpdateAuth }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 4) {
      setMsg({ type: 'error', text: 'Password too short (min 4 chars).' });
      return;
    }

    onUpdateAuth(newUsername || 'admin', newPassword);
    setMsg({ type: 'success', text: 'Credentials updated successfully!' });
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Settings</h1>
        <p className="text-slate-400">Manage administrative access and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-slate-100">Administrator Account</span>
            </h3>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Admin Username</label>
                  <input 
                    type="text" 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. netadmin"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
                <div></div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              {msg.text && (
                <div className={`p-4 rounded-xl text-sm font-medium border ${msg.type === 'error' ? 'bg-red-950 border-red-800 text-red-200' : 'bg-green-950 border-green-800 text-green-200'}`}>
                  {msg.text}
                </div>
              )}

              <div className="pt-4 border-t border-slate-700 flex justify-end">
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  Save Account Changes
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8">
             <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-slate-100">Persistence & Backup</span>
            </h3>
            <p className="text-slate-400 text-sm mb-6">Backup and restore your entire network documentation data. The backup includes subnets, IP records, VLANs, NAT rules, WiFi networks, and applications.</p>
            <div className="flex space-x-4 items-center">
              <button 
                onClick={() => {
                  const backup = {
                    subnets: JSON.parse(localStorage.getItem('subnets') || '[]'),
                    vlans: JSON.parse(localStorage.getItem('vlans') || '[]'),
                    ipAddresses: JSON.parse(localStorage.getItem('ipAddresses') || '[]'),
                    wifiNetworks: JSON.parse(localStorage.getItem('wifiNetworks') || '[]'),
                    natRules: JSON.parse(localStorage.getItem('natRules') || '[]'),
                    applications: JSON.parse(localStorage.getItem('applications') || '[]'),
                  };
                  const data = JSON.stringify(backup, null, 2);
                  const blob = new Blob([data], {type: 'application/json'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'netkeeper_backup.json';
                  a.click();
                }}
                className="px-5 py-2 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Export Backup
              </button>
              <label className="px-5 py-2 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer">
                Import Backup
                <input type="file" accept="application/json" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  try {
                    const backup = JSON.parse(text);
                    if (backup.subnets) localStorage.setItem('subnets', JSON.stringify(backup.subnets));
                    if (backup.vlans) localStorage.setItem('vlans', JSON.stringify(backup.vlans));
                    if (backup.ipAddresses) localStorage.setItem('ipAddresses', JSON.stringify(backup.ipAddresses));
                    if (backup.wifiNetworks) localStorage.setItem('wifiNetworks', JSON.stringify(backup.wifiNetworks));
                    if (backup.natRules) localStorage.setItem('natRules', JSON.stringify(backup.natRules));
                    if (backup.applications) localStorage.setItem('applications', JSON.stringify(backup.applications));
                    window.location.reload();
                  } catch {
                    alert('Invalid backup file.');
                  }
                }} />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800">
            <h4 className="font-bold mb-2">Security Advice</h4>
            <ul className="text-xs text-slate-400 space-y-3 list-disc pl-4">
              <li>Change the default "admin" password immediately.</li>
              <li>Ensure this portal is only accessible via trusted VPN.</li>
              <li>Regularly rotate your administrative credentials.</li>
              <li>Exports include plain-text WiFi keys. Store backups securely.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
