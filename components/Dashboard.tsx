
import React from 'react';
import { Subnet, VLAN, NATRule } from '../types.ts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardProps {
  subnets: Subnet[];
  vlans: VLAN[];
  natRules: NATRule[];
}

const Dashboard: React.FC<DashboardProps> = ({ subnets, vlans, natRules }) => {
  // Health data calculation
  const getOfflineData = () => {
    try {
      const savedIps = JSON.parse(localStorage.getItem('ipAddresses') || '[]');
      const onlineDevices = savedIps.filter((ip: any) => ip.isOnline).length;
      const offlineDevices = savedIps.filter((ip: any) => ip.isOnline === false).length;
      return { onlineDevices, offlineDevices, totalTracked: savedIps.length };
    } catch (e) {
      return { onlineDevices: 0, offlineDevices: 0, totalTracked: 0 };
    }
  };

  const { onlineDevices, offlineDevices, totalTracked } = getOfflineData();

  const totalUsedIps = subnets.reduce((acc, s) => acc + s.usedIps, 0);
  const totalAvailableIps = subnets.reduce((acc, s) => acc + s.totalIps, 0);
  const occupancyRate = totalAvailableIps > 0 ? (totalUsedIps / totalAvailableIps) * 100 : 0;

  const subnetChartData = subnets.length > 0 
    ? subnets.map(s => ({ name: s.name, value: s.usedIps }))
    : [{ name: 'None', value: 0 }];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-400 drop-shadow">Network Overview</h1>
          <p className="text-cyan-500">Real-time status of your self-hosted infrastructure.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-cyan-500 uppercase font-bold">System Status: </span>
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-green-400/20 to-cyan-400/20 text-green-700 rounded-full border border-green-100 shadow-md">
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
             <span className="text-xs font-bold">HEALTHY</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-slate-900/70 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-slate-800">
          <p className="text-cyan-400 text-sm font-semibold mb-1">Live Devices</p>
          <div className="flex items-end space-x-2">
            <h3 className="text-4xl font-extrabold text-cyan-400 drop-shadow">{onlineDevices}</h3>
            <span className="text-cyan-500 text-base mb-1">/ {totalTracked} total</span>
          </div>
          <div className="mt-4 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full" style={{width: totalTracked > 0 ? `${(onlineDevices/totalTracked)*100}%` : '0%'}}></div>
          </div>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-slate-800">
          <p className="text-cyan-400 text-sm font-semibold mb-1">VLAN Segments</p>
          <h3 className="text-4xl font-extrabold text-cyan-400 drop-shadow">{vlans.length}</h3>
          <p className="text-xs text-cyan-500 mt-2 font-mono">Isolated domains</p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-slate-800">
          <p className="text-cyan-400 text-sm font-semibold mb-1">IP Utilization</p>
          <h3 className="text-4xl font-extrabold text-cyan-400 drop-shadow">{occupancyRate.toFixed(1)}%</h3>
          <p className="text-xs text-cyan-500 mt-2">Space allocated</p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-slate-800">
          <p className="text-cyan-400 text-sm font-semibold mb-1">NAT Rules</p>
          <h3 className="text-4xl font-extrabold text-cyan-400 drop-shadow">{natRules.length}</h3>
          <p className="text-xs text-cyan-500 mt-2">Active mappings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-slate-800">
          <h3 className="text-xl font-extrabold mb-6 text-cyan-400 drop-shadow">Subnet Occupancy</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subnetChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2fe" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#06b6d4', fontSize: 13, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#06b6d4', fontSize: 13, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f0fdfa'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(6 182 212 / 0.1)' }}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-slate-800">
          <h3 className="text-xl font-extrabold mb-6 text-cyan-400 drop-shadow">Address Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Online', value: onlineDevices, color: '#10b981' },
                    { name: 'Offline', value: offlineDevices, color: '#ef4444' },
                    { name: 'Available', value: Math.max(0, totalAvailableIps - totalTracked), color: '#f1f5f9' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#f1f5f9" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                   <div className="w-3 h-3 rounded-full bg-green-400"></div>
                   <span className="text-base text-cyan-400">Online</span>
                </div>
                <span className="font-extrabold text-cyan-400">{onlineDevices}</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                   <div className="w-3 h-3 rounded-full bg-red-400"></div>
                   <span className="text-base text-cyan-400">Offline</span>
                </div>
                <span className="font-extrabold text-cyan-400">{offlineDevices}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
