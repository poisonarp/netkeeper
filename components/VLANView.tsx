

import React from 'react';
import { Subnet } from '../types.ts';

interface VLANViewProps {
  subnets: Subnet[];
}

const VLANView: React.FC<VLANViewProps> = ({ subnets }) => {
  // Aggregate VLANs from subnets
  const vlanMap: { [key: string]: { vlanNumber: string; name: string; description: string; subnets: Subnet[] } } = {};
  subnets.forEach(subnet => {
    if (subnet.vlanId) {
      const key = subnet.vlanId;
      if (!vlanMap[key]) {
        vlanMap[key] = {
          vlanNumber: subnet.vlanId,
          name: subnet.vlanName || '',
          description: subnet.vlanDescription || '',
          subnets: []
        };
      }
      vlanMap[key].subnets.push(subnet);
    }
  });
  const vlans = Object.values(vlanMap);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">VLAN Segments</h1>
          <p className="text-slate-400">Track and label virtual network segments across the infrastructure.</p>
        </div>
      </div>

      {subnets.length === 0 && (
        <div className="bg-amber-950 border border-amber-800 text-amber-200 rounded-lg px-4 py-3 mb-6 text-center">
          <strong>Warning:</strong> You must add a subnet before VLANs can be created or displayed.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vlans.length === 0 ? (
          <div className="col-span-3 text-center text-slate-400">No VLANs found.</div>
        ) : (
          vlans.map(vlan => (
            <div key={vlan.vlanNumber} className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-indigo-400">ID: {vlan.vlanNumber}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">{vlan.name || 'Unnamed VLAN'}</h3>
              <p className="text-slate-400 text-sm mb-4 h-10 overflow-hidden">{vlan.description}</p>
              <div className="flex flex-col pt-4 border-t border-slate-700">
                <span className="text-xs font-bold text-slate-500 uppercase mb-1">Linked Subnets</span>
                <ul className="list-disc ml-4">
                  {vlan.subnets.map(subnet => (
                    <li key={subnet.id} className="text-xs text-slate-300">{subnet.name} ({subnet.cidr})</li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VLANView;
