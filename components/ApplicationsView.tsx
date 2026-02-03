import React, { useState } from 'react';
import { Application } from '../types.ts';

import { IPAddress } from '../types.ts';

interface ApplicationsViewProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  ipAddresses: IPAddress[];
}

const ApplicationsView: React.FC<ApplicationsViewProps> = ({ applications, setApplications, ipAddresses }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newApp, setNewApp] = useState<Partial<Application>>({ name: '', url: '', description: '', host: '' });

  const handleAdd = () => {
    if (newApp.name && newApp.url) {
      setApplications([
        ...applications,
        { id: Math.random().toString(36).substr(2, 9), name: newApp.name, url: newApp.url, description: newApp.description, host: newApp.host }
      ]);
      setNewApp({ name: '', url: '', description: '', host: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Applications</h1>
          <p className="text-slate-400">Manage and document hosted applications.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-900/20 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Add Application</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-cyan-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-bold mb-4 text-slate-100">New Application</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Name</label>
              <input type="text" value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL</label>
              <input type="text" value={newApp.url} onChange={e => setNewApp({ ...newApp, url: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Host</label>
              <select
                value={newApp.host || ''}
                onChange={e => setNewApp({ ...newApp, host: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="">Select a device...</option>
                {ipAddresses.map(ip => (
                  <option key={ip.id} value={ip.hostname}>{ip.hostname} ({ip.address})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
              <input type="text" value={newApp.description} onChange={e => setNewApp({ ...newApp, description: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2 bg-cyan-700 text-white rounded-lg">Confirm</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">URL</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Host</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {applications.map(app => (
              <tr key={app.id}>
                <td className="px-6 py-4 font-semibold text-slate-100">{app.name}</td>
                <td className="px-6 py-4 text-cyan-400 font-mono"><a href={app.url} target="_blank" rel="noopener noreferrer">{app.url}</a></td>
                <td className="px-6 py-4 text-slate-400">{app.host}</td>
                <td className="px-6 py-4 text-slate-400">{app.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationsView;
