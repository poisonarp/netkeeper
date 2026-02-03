
import React from 'react';
import { NATRule } from '../types.ts';

interface NATViewProps {
  natRules: NATRule[];
  setNatRules: React.Dispatch<React.SetStateAction<NATRule[]>>;
}

const NATView: React.FC<NATViewProps> = ({ natRules, setNatRules }) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newRule, setNewRule] = React.useState<Partial<NATRule>>({
    internalIp: '',
    internalPort: undefined,
    externalIp: '',
    externalPort: undefined,
    protocol: 'TCP',
    description: ''
  });

  const handleAdd = () => {
    if (newRule.internalIp && newRule.externalIp && newRule.protocol) {
      setNatRules([
        ...natRules,
        {
          id: Math.random().toString(36).substr(2, 9),
          internalIp: newRule.internalIp,
          internalPort: newRule.internalPort ? Number(newRule.internalPort) : undefined,
          externalIp: newRule.externalIp,
          externalPort: newRule.externalPort ? Number(newRule.externalPort) : undefined,
          protocol: newRule.protocol,
          description: newRule.description || ''
        }
      ]);
      setNewRule({ internalIp: '', internalPort: undefined, externalIp: '', externalPort: undefined, protocol: 'TCP', description: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">NAT Configuration</h1>
          <p className="text-slate-400">Manage 1:1 NAT, Static PAT, and port translation rules.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>New NAT Rule</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 animate-in slide-in-from-top duration-300 mb-6">
          <h3 className="text-lg font-bold mb-4 text-slate-100">New NAT Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Internal IP</label>
              <input type="text" value={newRule.internalIp} onChange={e => setNewRule({ ...newRule, internalIp: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Internal Port</label>
              <input type="number" value={newRule.internalPort || ''} onChange={e => setNewRule({ ...newRule, internalPort: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">External IP</label>
              <input type="text" value={newRule.externalIp} onChange={e => setNewRule({ ...newRule, externalIp: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">External Port</label>
              <input type="number" value={newRule.externalPort || ''} onChange={e => setNewRule({ ...newRule, externalPort: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Protocol</label>
              <select value={newRule.protocol} onChange={e => setNewRule({ ...newRule, protocol: e.target.value as any })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
              <input type="text" value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-500" />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-slate-300">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Confirm</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Endpoint</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Direction</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">External Endpoint</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Protocol</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-sm">
            {natRules.map(rule => (
              <tr key={rule.id} className="hover:bg-slate-800 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-100">{rule.internalIp}</span>
                  {rule.internalPort && <span className="text-blue-400 ml-1">:{rule.internalPort}</span>}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center text-slate-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-emerald-400">{rule.externalIp}</span>
                  {rule.externalPort && <span className="text-emerald-400 ml-1">:{rule.externalPort}</span>}
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-bold">{rule.protocol}</span>
                </td>
                <td className="px-6 py-4 text-slate-400 font-sans text-xs italic">
                  {rule.description}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-500 hover:text-slate-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NATView;
