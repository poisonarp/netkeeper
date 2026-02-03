
import React, { useState } from 'react';

const DocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">NetKeeper Pro Help</h1>
          <p className="text-slate-400">How to use all features of the app.</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-10 prose prose-slate prose-invert max-w-none">
        <h2 className="text-xl font-bold mb-4 text-slate-100">App Functions Overview</h2>
        <ul className="list-disc pl-5 space-y-4 text-slate-300">
          <li><strong>Dashboard:</strong> View a summary of your network, subnets, VLANs, NAT rules, WiFi networks, and applications.</li>
          <li><strong>IPAM:</strong> Add, edit, and delete subnets. Track device health, manage DHCP ranges, and register devices.</li>
          <li><strong>VLANs:</strong> View VLAN segments aggregated from subnets. Add VLAN info when creating or editing subnets. Warning: You must add a subnet before VLANs can be displayed.</li>
          <li><strong>NAT:</strong> Add, edit, and view NAT rules for 1:1 NAT, Static PAT, and port translation. Each rule can specify internal/external IPs, ports, protocol, and notes.</li>
          <li><strong>WiFi:</strong> Add and manage WiFi networks, including SSID, security, band, VLAN association, and activation status.</li>
          <li><strong>Applications:</strong> Add, edit, and list hosted applications. Assign each application to a device (host) already registered in IPAM.</li>
          <li><strong>Settings:</strong> Update admin credentials and backup/restore your network documentation data.</li>
          <li><strong>Documentation:</strong> Access this help page for guidance on using all features.</li>
        </ul>

        <h2 className="text-xl font-bold mt-10 mb-4 text-slate-100">Feature Details</h2>
        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-200">Subnet Management (IPAM)</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Add a subnet with name, CIDR, gateway, VLAN info, description, and DHCP settings.</li>
          <li>Edit or delete existing subnets. Register devices to subnets and monitor their status.</li>
        </ul>
        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-200">VLAN Segments</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>VLANs are created by adding VLAN info to subnets. The VLANs page lists all VLANs and their linked subnets.</li>
        </ul>
        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-200">NAT Rules</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Add a new NAT rule with internal/external IPs, ports, protocol, and description.</li>
          <li>View all NAT rules in a table. Edit and delete features can be added as needed.</li>
        </ul>
        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-200">WiFi Networks</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Add and manage WiFi networks, including SSID, password, security type, band, VLAN association, and activation status.</li>
        </ul>
        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-200">Applications</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Add hosted applications, assign them to a device (host) from your registered IPAM devices, and provide a description and URL.</li>
        </ul>
        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-200">Settings & Backup</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Change admin credentials and backup/restore your network documentation data.</li>
        </ul>
        <div className="mt-12 pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Last updated: {new Date().toLocaleDateString()}</span>
          <span className="flex items-center space-x-1 cursor-pointer hover:text-cyan-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <span>Edit this page</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocsView;
