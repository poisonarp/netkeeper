
import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const adminName = localStorage.getItem('nk_admin_user') || 'Admin';

  return (
    <header className="h-20 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xl shadow-slate-900/10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-cyan-400">
            <svg className="w-6 h-6 group-hover:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3 border border-slate-700 rounded-2xl leading-6 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-base shadow-md"
            placeholder="Search IPs, VLANs, MACs..."
          />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button 
          onClick={onOpenSettings}
          className="p-3 rounded-xl text-cyan-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 transition-colors shadow-sm"
          title="System Settings"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <button className="p-3 rounded-xl text-cyan-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 relative transition-colors shadow-sm">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        <div className="h-10 w-px bg-slate-700 mx-2"></div>
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={onOpenSettings}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-cyan-400 font-extrabold text-lg ring-2 ring-transparent group-hover:ring-cyan-400 transition-all shadow-md">
            {adminName.substring(0, 1).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-base font-extrabold text-slate-100 leading-none drop-shadow">{adminName}</p>
            <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider mt-1">Superuser</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
