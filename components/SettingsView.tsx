import React, { useState, useEffect } from 'react';
import { NotificationSettings } from '../types.ts';
import { 
  loadNotificationSettings, 
  saveNotificationSettings, 
  defaultNotificationSettings,
  testNotification 
} from '../services/notificationService.ts';

interface SettingsViewProps {
  onUpdateAuth: (user: string, pass: string) => void;
}

type NotificationTab = 'discord' | 'gotify' | 'ntfy' | 'smtp';

const SettingsView: React.FC<SettingsViewProps> = ({ onUpdateAuth }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // Notification settings state
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [activeNotifTab, setActiveNotifTab] = useState<NotificationTab>('discord');
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ channel: string; success: boolean } | null>(null);
  const [notifSaved, setNotifSaved] = useState(false);

  // Load notification settings on mount
  useEffect(() => {
    const settings = loadNotificationSettings();
    setNotifSettings(settings);
  }, []);

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

  const handleSaveNotifications = () => {
    saveNotificationSettings(notifSettings);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const handleTestNotification = async (channel: NotificationTab) => {
    setTestingChannel(channel);
    setTestResult(null);
    
    let config;
    switch (channel) {
      case 'discord': config = notifSettings.discord; break;
      case 'gotify': config = notifSettings.gotify; break;
      case 'ntfy': config = notifSettings.ntfy; break;
      case 'smtp': config = notifSettings.smtp; break;
    }

    const success = await testNotification(channel, config);
    setTestResult({ channel, success });
    setTestingChannel(null);
  };

  const updateDiscord = (updates: Partial<typeof notifSettings.discord>) => {
    setNotifSettings(prev => ({ ...prev, discord: { ...prev.discord, ...updates } }));
  };

  const updateGotify = (updates: Partial<typeof notifSettings.gotify>) => {
    setNotifSettings(prev => ({ ...prev, gotify: { ...prev.gotify, ...updates } }));
  };

  const updateNtfy = (updates: Partial<typeof notifSettings.ntfy>) => {
    setNotifSettings(prev => ({ ...prev, ntfy: { ...prev.ntfy, ...updates } }));
  };

  const updateSmtp = (updates: Partial<typeof notifSettings.smtp>) => {
    setNotifSettings(prev => ({ ...prev, smtp: { ...prev.smtp, ...updates } }));
  };

  const tabIcons: Record<NotificationTab, React.ReactNode> = {
    discord: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
    gotify: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    ntfy: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    smtp: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Settings</h1>
        <p className="text-slate-400">Manage administrative access, notifications, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Account */}
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

          {/* Notifications Section */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-slate-100">Notification Providers</span>
            </h3>

            {/* Alert Settings */}
            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h4 className="text-sm font-bold text-slate-300 mb-4">Alert Triggers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.alertOnOffline}
                    onChange={(e) => setNotifSettings(prev => ({ ...prev, alertOnOffline: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm text-slate-300">Alert when device goes offline</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.alertOnBackOnline}
                    onChange={(e) => setNotifSettings(prev => ({ ...prev, alertOnBackOnline: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm text-slate-300">Alert when device comes back online</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.alertOnHighLatency}
                    onChange={(e) => setNotifSettings(prev => ({ ...prev, alertOnHighLatency: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm text-slate-300">Alert on high latency</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-400">Latency threshold:</label>
                  <input
                    type="number"
                    value={notifSettings.highLatencyThreshold}
                    onChange={(e) => setNotifSettings(prev => ({ ...prev, highLatencyThreshold: parseInt(e.target.value) || 200 }))}
                    className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200"
                  />
                  <span className="text-sm text-slate-500">ms</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-400">Cooldown between alerts:</label>
                  <input
                    type="number"
                    value={notifSettings.cooldownMinutes}
                    onChange={(e) => setNotifSettings(prev => ({ ...prev, cooldownMinutes: parseInt(e.target.value) || 5 }))}
                    className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200"
                  />
                  <span className="text-sm text-slate-500">minutes</span>
                </div>
              </div>
            </div>

            {/* Provider Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-700 pb-4">
              {(['discord', 'gotify', 'ntfy', 'smtp'] as NotificationTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveNotifTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeNotifTab === tab
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {tabIcons[tab]}
                  <span className="capitalize">{tab}</span>
                  {((tab === 'discord' && notifSettings.discord.enabled) ||
                    (tab === 'gotify' && notifSettings.gotify.enabled) ||
                    (tab === 'ntfy' && notifSettings.ntfy.enabled) ||
                    (tab === 'smtp' && notifSettings.smtp.enabled)) && (
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Discord Config */}
            {activeNotifTab === 'discord' && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.discord.enabled}
                    onChange={(e) => updateDiscord({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm font-medium text-slate-300">Enable Discord notifications</span>
                </label>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Webhook URL</label>
                  <input
                    type="url"
                    value={notifSettings.discord.webhookUrl}
                    onChange={(e) => updateDiscord({ webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500 font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500">Create a webhook in your Discord channel settings</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Bot Username (optional)</label>
                    <input
                      type="text"
                      value={notifSettings.discord.username || ''}
                      onChange={(e) => updateDiscord({ username: e.target.value })}
                      placeholder="NetKeeper"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Role ID to Mention (optional)</label>
                    <input
                      type="text"
                      value={notifSettings.discord.mentionRoleId || ''}
                      onChange={(e) => updateDiscord({ mentionRoleId: e.target.value })}
                      placeholder="123456789012345678"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gotify Config */}
            {activeNotifTab === 'gotify' && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.gotify.enabled}
                    onChange={(e) => updateGotify({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm font-medium text-slate-300">Enable Gotify notifications</span>
                </label>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Server URL</label>
                  <input
                    type="url"
                    value={notifSettings.gotify.serverUrl}
                    onChange={(e) => updateGotify({ serverUrl: e.target.value })}
                    placeholder="https://gotify.example.com"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">App Token</label>
                  <input
                    type="password"
                    value={notifSettings.gotify.appToken}
                    onChange={(e) => updateGotify({ appToken: e.target.value })}
                    placeholder="A••••••••••"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500 font-mono"
                  />
                  <p className="mt-1 text-xs text-slate-500">Create an application in Gotify and use its token</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Priority (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={notifSettings.gotify.priority}
                    onChange={(e) => updateGotify({ priority: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>1 (Low)</span>
                    <span className="text-cyan-400 font-medium">{notifSettings.gotify.priority}</span>
                    <span>10 (Critical)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ntfy Config */}
            {activeNotifTab === 'ntfy' && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.ntfy.enabled}
                    onChange={(e) => updateNtfy({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm font-medium text-slate-300">Enable Ntfy notifications</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Server URL</label>
                    <input
                      type="url"
                      value={notifSettings.ntfy.serverUrl}
                      onChange={(e) => updateNtfy({ serverUrl: e.target.value })}
                      placeholder="https://ntfy.sh"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Topic</label>
                    <input
                      type="text"
                      value={notifSettings.ntfy.topic}
                      onChange={(e) => updateNtfy({ topic: e.target.value })}
                      placeholder="netkeeper-alerts"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Username (optional)</label>
                    <input
                      type="text"
                      value={notifSettings.ntfy.username || ''}
                      onChange={(e) => updateNtfy({ username: e.target.value })}
                      placeholder="For protected topics"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password (optional)</label>
                    <input
                      type="password"
                      value={notifSettings.ntfy.password || ''}
                      onChange={(e) => updateNtfy({ password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Priority</label>
                  <select
                    value={notifSettings.ntfy.priority}
                    onChange={(e) => updateNtfy({ priority: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value={1}>1 - Min</option>
                    <option value={2}>2 - Low</option>
                    <option value={3}>3 - Default</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Urgent</option>
                  </select>
                </div>
              </div>
            )}

            {/* SMTP Config */}
            {activeNotifTab === 'smtp' && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.smtp.enabled}
                    onChange={(e) => updateSmtp({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm font-medium text-slate-300">Enable Email (SMTP) notifications</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={notifSettings.smtp.host}
                      onChange={(e) => updateSmtp({ host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Port</label>
                      <input
                        type="number"
                        value={notifSettings.smtp.port}
                        onChange={(e) => updateSmtp({ port: parseInt(e.target.value) || 587 })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                    <label className="flex items-end gap-2 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={notifSettings.smtp.secure}
                        onChange={(e) => updateSmtp({ secure: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                      />
                      <span className="text-sm text-slate-300">SSL/TLS</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Username</label>
                    <input
                      type="text"
                      value={notifSettings.smtp.username}
                      onChange={(e) => updateSmtp({ username: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password / App Password</label>
                    <input
                      type="password"
                      value={notifSettings.smtp.password}
                      onChange={(e) => updateSmtp({ password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">From Address</label>
                  <input
                    type="email"
                    value={notifSettings.smtp.fromAddress}
                    onChange={(e) => updateSmtp({ fromAddress: e.target.value })}
                    placeholder="netkeeper@yourdomain.com"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">To Addresses (comma separated)</label>
                  <input
                    type="text"
                    value={notifSettings.smtp.toAddresses.join(', ')}
                    onChange={(e) => updateSmtp({ toAddresses: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="admin@example.com, team@example.com"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Test & Save */}
            <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTestNotification(activeNotifTab)}
                  disabled={testingChannel !== null}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {testingChannel === activeNotifTab ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Testing...
                    </>
                  ) : (
                    <>Test {activeNotifTab}</>
                  )}
                </button>
                {testResult && testResult.channel === activeNotifTab && (
                  <span className={`text-sm font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.success ? '✓ Test sent!' : '✗ Test failed'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notifSaved && (
                  <span className="text-sm text-green-400 font-medium">✓ Settings saved!</span>
                )}
                <button
                  onClick={handleSaveNotifications}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>

          {/* Backup Section */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-slate-100">Persistence & Backup</span>
            </h3>
            <p className="text-slate-400 text-sm mb-6">Backup and restore your entire network documentation data. The backup includes subnets, IP records, VLANs, NAT rules, WiFi networks, and applications.</p>
            <div className="flex space-x-4 items-center">
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/data');
                    const backup = await response.json();
                    const data = JSON.stringify(backup, null, 2);
                    const blob = new Blob([data], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `netkeeper_backup_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    alert('Failed to export backup: ' + error);
                  }
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
                    if (!backup.subnets && !backup.vlans && !backup.ipAddresses) {
                      alert('Invalid backup file format.');
                      return;
                    }
                    const response = await fetch('/api/data', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(backup)
                    });
                    if (response.ok) {
                      alert('Backup restored successfully! Reloading...');
                      window.location.reload();
                    } else {
                      alert('Failed to restore backup.');
                    }
                  } catch (error) {
                    alert('Invalid backup file: ' + error);
                  }
                }} />
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar */}
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

          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Notification Setup Tips
            </h4>
            <ul className="text-xs text-slate-400 space-y-3 list-disc pl-4">
              <li><strong className="text-slate-300">Discord:</strong> Create a webhook in Channel Settings → Integrations</li>
              <li><strong className="text-slate-300">Gotify:</strong> Self-host or use a Gotify instance, create an app for token</li>
              <li><strong className="text-slate-300">Ntfy:</strong> Use ntfy.sh or self-host, no account needed</li>
              <li><strong className="text-slate-300">SMTP:</strong> For Gmail, use an App Password instead of your main password</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-2xl p-6 border border-cyan-800/50">
            <h4 className="font-bold text-cyan-300 mb-2">Enabled Channels</h4>
            <div className="space-y-2">
              {[
                { name: 'Discord', enabled: notifSettings.discord.enabled },
                { name: 'Gotify', enabled: notifSettings.gotify.enabled },
                { name: 'Ntfy', enabled: notifSettings.ntfy.enabled },
                { name: 'SMTP', enabled: notifSettings.smtp.enabled },
              ].map(ch => (
                <div key={ch.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{ch.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${ch.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                    {ch.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
