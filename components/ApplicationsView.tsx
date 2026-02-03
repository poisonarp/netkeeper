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
      const added: Application = {
        id: Math.random().toString(36).substr(2, 9),
        name: newApp.name || '',
        url: newApp.url || '',
        description: newApp.description || '',
        host: newApp.host || ''
      };
      setApplications([...applications, added]);
      setNewApp({ name: '', url: '', description: '', host: '' });
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    setApplications(applications.filter(app => app.id !== id));
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
            <button onClick={() => { setIsAdding(false); setNewApp({ name: '', url: '', description: '', host: '' }); }} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-600 transition-colors">Confirm</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-bold text-slate-400 mb-2">No Applications</h3>
            <p className="text-slate-500">Add your first application to start tracking</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">URL</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Host</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-800/60 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-slate-100">{app.name}</td>
                  <td className="px-6 py-4">
                    <a 
                      href={app.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 font-mono hover:text-cyan-300 hover:underline transition-colors"
                    >
                      {app.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{app.host || '-'}</td>
                  <td className="px-6 py-4 text-slate-400">{app.description || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(app.id)}
                      className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete application"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ApplicationsView;
