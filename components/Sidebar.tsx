
import React from 'react';
import { View } from '../types.ts';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  dbStatus: 'connected' | 'offline' | 'syncing';
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, dbStatus, onLogout }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { id: View.IPAM, label: 'IPAM', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    )},
    { id: View.VLAN, label: 'VLANs', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    )},
    { id: View.NAT, label: 'NAT Mappings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1.5 3 3.5 3H18c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3H7.5C5.5 4 4 5 4 7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16" /></svg>
    )},
    { id: View.WIFI, label: 'WiFi Networks', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.9 9.9 0 0114.142 0M2.006 8.854a15.356 15.356 0 0121.988 0" /></svg>
    )},
    { id: View.DIAGRAM, label: 'Topology', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
    )},
    { id: View.APPLICATIONS, label: 'Applications', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
    )},
    { id: View.DOCS, label: 'Documentation', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )},
    { id: View.SETTINGS, label: 'Settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
  ];

  const getStatusColor = () => {
    if (dbStatus === 'connected') return 'bg-green-500';
    if (dbStatus === 'syncing') return 'bg-blue-400';
    return 'bg-amber-500';
  };

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900/80 to-slate-900/80 backdrop-blur-xl flex-shrink-0 flex flex-col border-r border-slate-800 shadow-2xl shadow-blue-900/10">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/30 ring-2 ring-white/10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
        </div>
        <span className="text-2xl font-extrabold text-white tracking-tight drop-shadow">NetKeeper <span className="text-cyan-300">Pro</span></span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
    {menuItems.map((item) => (
      <button
      key={item.id}
      onClick={() => setView(item.id)}
      className={`w-full flex items-center px-4 py-3 mb-2 rounded-xl transition-all font-semibold text-lg shadow-sm hover:bg-cyan-700/30 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${currentView === item.id ? 'bg-cyan-600/80 text-white shadow-lg' : 'text-cyan-100 bg-transparent'}`}
      >
      <span className="mr-3">{item.icon}</span>
      {item.label}
      </button>
    ))}
        </nav>

        <div className="px-6 py-4 mt-auto flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <span className={`inline-block w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></span>
      <span className="text-xs text-cyan-200 font-semibold">{dbStatus.charAt(0).toUpperCase() + dbStatus.slice(1)}</span>
      {dbStatus === 'offline' && (
      <span className="text-[10px] bg-amber-900/40 text-amber-500 px-1.5 py-0.5 rounded border border-amber-800 ml-2">Local Only</span>
      )}
    </div>
    <button
      onClick={onLogout}
      className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold shadow-md hover:from-red-500 hover:to-pink-500 transition-all focus:outline-none focus:ring-2 focus:ring-pink-300"
    >
      Logout
    </button>
        </div>
      </div>
    );
  }

  export default Sidebar;
