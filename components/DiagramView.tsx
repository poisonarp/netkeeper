
import React, { useEffect, useRef, useState } from 'react';
import { Subnet, IPAddress } from '../types.ts';
import * as d3 from 'd3';

interface DiagramViewProps {
  subnets: Subnet[];
  ipAddresses: IPAddress[];
}

const DiagramView: React.FC<DiagramViewProps> = ({ subnets, ipAddresses }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedSubnetId, setSelectedSubnetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'subnet'>('overview');

  const selectedSubnet = subnets.find(s => s.id === selectedSubnetId);
  const subnetDevices = ipAddresses.filter(ip => ip.subnetId === selectedSubnetId);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 900;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (viewMode === 'overview') {
      // Overview mode: Show all subnets connected to core router
      if (subnets.length === 0) return;

      const nodes = [
        { id: 'CORE_ROUTER', type: 'router', label: 'Core Router', x: width / 2, y: height / 2 },
        ...subnets.map((s, i) => {
          const angle = (i / subnets.length) * 2 * Math.PI;
          const radius = 200;
          return {
            id: s.id,
            type: 'subnet',
            label: s.name,
            cidr: s.cidr,
            devices: ipAddresses.filter(ip => ip.subnetId === s.id).length,
            x: width / 2 + radius * Math.cos(angle),
            y: height / 2 + radius * Math.sin(angle)
          };
        })
      ];

      const links = subnets.map(s => ({
        source: 'CORE_ROUTER',
        target: s.id
      }));

      // Draw links
      svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("x1", (d: any) => nodes.find(n => n.id === d.source)?.x || 0)
        .attr("y1", (d: any) => nodes.find(n => n.id === d.source)?.y || 0)
        .attr("x2", (d: any) => nodes.find(n => n.id === d.target)?.x || 0)
        .attr("y2", (d: any) => nodes.find(n => n.id === d.target)?.y || 0)
        .attr("stroke", "#475569")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.4);

      // Draw nodes
      const nodeGroups = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
        .style("cursor", (d: any) => d.type === 'subnet' ? 'pointer' : 'default')
        .on("click", (event, d: any) => {
          if (d.type === 'subnet') {
            setSelectedSubnetId(d.id);
            setViewMode('subnet');
          }
        });

      // Router node
      nodeGroups.filter((d: any) => d.type === 'router')
        .append("rect")
        .attr("x", -40)
        .attr("y", -30)
        .attr("width", 80)
        .attr("height", 60)
        .attr("rx", 8)
        .attr("fill", "#1e293b")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 3);

      nodeGroups.filter((d: any) => d.type === 'router')
        .append("text")
        .text((d: any) => d.label)
        .attr("text-anchor", "middle")
        .attr("dy", 5)
        .attr("fill", "#fff")
        .style("font-size", "14px")
        .style("font-weight", "700");

      // Subnet nodes
      nodeGroups.filter((d: any) => d.type === 'subnet')
        .append("circle")
        .attr("r", 35)
        .attr("fill", "#3b82f6")
        .attr("stroke", "#60a5fa")
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))");

      nodeGroups.filter((d: any) => d.type === 'subnet')
        .append("text")
        .text((d: any) => d.label)
        .attr("text-anchor", "middle")
        .attr("dy", -45)
        .attr("fill", "#e2e8f0")
        .style("font-size", "13px")
        .style("font-weight", "700");

      nodeGroups.filter((d: any) => d.type === 'subnet')
        .append("text")
        .text((d: any) => d.cidr)
        .attr("text-anchor", "middle")
        .attr("dy", 50)
        .attr("fill", "#94a3b8")
        .style("font-size", "11px")
        .style("font-family", "monospace");

      nodeGroups.filter((d: any) => d.type === 'subnet')
        .append("text")
        .text((d: any) => `${d.devices} devices`)
        .attr("text-anchor", "middle")
        .attr("dy", 5)
        .attr("fill", "#fff")
        .style("font-size", "12px")
        .style("font-weight", "600");

    } else if (viewMode === 'subnet' && selectedSubnet) {
      // Subnet detail mode: Show gateway and all devices in this subnet
      const nodes = [
        { 
          id: 'gateway', 
          type: 'gateway', 
          label: selectedSubnet.gateway || 'Gateway',
          ip: selectedSubnet.gateway,
          x: width / 2, 
          y: 100 
        },
        ...subnetDevices.map((device, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          return {
            id: device.id,
            type: 'device',
            label: device.hostname,
            ip: device.address,
            mac: device.mac,
            status: device.status,
            isOnline: device.isOnline,
            x: 150 + col * 150,
            y: 250 + row * 120
          };
        })
      ];

      const links = subnetDevices.map(d => ({
        source: 'gateway',
        target: d.id
      }));

      // Draw links
      svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("x1", (d: any) => nodes.find(n => n.id === d.source)?.x || 0)
        .attr("y1", (d: any) => nodes.find(n => n.id === d.source)?.y || 0)
        .attr("x2", (d: any) => nodes.find(n => n.id === d.target)?.x || 0)
        .attr("y2", (d: any) => nodes.find(n => n.id === d.target)?.y || 0)
        .attr("stroke", "#475569")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.3);

      // Draw nodes
      const nodeGroups = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      // Gateway node
      nodeGroups.filter((d: any) => d.type === 'gateway')
        .append("rect")
        .attr("x", -50)
        .attr("y", -35)
        .attr("width", 100)
        .attr("height", 70)
        .attr("rx", 10)
        .attr("fill", "#1e293b")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 3);

      nodeGroups.filter((d: any) => d.type === 'gateway')
        .append("text")
        .text((d: any) => d.label)
        .attr("text-anchor", "middle")
        .attr("dy", -5)
        .attr("fill", "#fff")
        .style("font-size", "13px")
        .style("font-weight", "700");

      nodeGroups.filter((d: any) => d.type === 'gateway')
        .append("text")
        .text((d: any) => d.ip || '')
        .attr("text-anchor", "middle")
        .attr("dy", 10)
        .attr("fill", "#10b981")
        .style("font-size", "11px")
        .style("font-family", "monospace");

      // Device nodes
      nodeGroups.filter((d: any) => d.type === 'device')
        .append("circle")
        .attr("r", 25)
        .attr("fill", (d: any) => d.isOnline ? "#3b82f6" : "#64748b")
        .attr("stroke", (d: any) => d.isOnline ? "#60a5fa" : "#94a3b8")
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))");

      nodeGroups.filter((d: any) => d.type === 'device')
        .append("text")
        .text((d: any) => d.label)
        .attr("text-anchor", "middle")
        .attr("dy", -35)
        .attr("fill", "#e2e8f0")
        .style("font-size", "12px")
        .style("font-weight", "600");

      nodeGroups.filter((d: any) => d.type === 'device')
        .append("text")
        .text((d: any) => d.ip)
        .attr("text-anchor", "middle")
        .attr("dy", 40)
        .attr("fill", "#94a3b8")
        .style("font-size", "10px")
        .style("font-family", "monospace");

      // Status indicator inside circle
      nodeGroups.filter((d: any) => d.type === 'device')
        .append("circle")
        .attr("r", 4)
        .attr("fill", (d: any) => d.isOnline ? "#22c55e" : "#ef4444")
        .attr("cy", -10);
    }

  }, [subnets, ipAddresses, selectedSubnetId, viewMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 drop-shadow">Network Topology</h1>
          <p className="text-slate-400 text-base mt-1">
            {viewMode === 'overview' 
              ? 'Interactive map of your infrastructure. Click a subnet to view details.' 
              : `Viewing ${selectedSubnet?.name} (${selectedSubnet?.cidr}) - ${subnetDevices.length} devices`
            }
          </p>
        </div>
        {viewMode === 'subnet' && (
          <button
            onClick={() => {
              setViewMode('overview');
              setSelectedSubnetId(null);
            }}
            className="px-5 py-3 bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors text-slate-300 shadow-md flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span>Back to Overview</span>
          </button>
        )}
      </div>

      {viewMode === 'overview' && subnets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subnets.map(subnet => {
            const deviceCount = ipAddresses.filter(ip => ip.subnetId === subnet.id).length;
            return (
              <button
                key={subnet.id}
                onClick={() => {
                  setSelectedSubnetId(subnet.id);
                  setViewMode('subnet');
                }}
                className="bg-slate-900/80 backdrop-blur-lg p-4 rounded-xl border border-slate-800 hover:border-cyan-600 transition-all text-left group"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-cyan-600 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-100 text-sm">{subnet.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{subnet.cidr}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{deviceCount} devices</span>
                  <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-slate-900/80 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-800 p-8 overflow-hidden relative min-h-[700px] flex items-center justify-center">
        {subnets.length === 0 ? (
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="text-xl font-bold text-slate-400 mb-2">No Subnets Configured</h3>
            <p className="text-slate-500">Add subnets in the IPAM view to see the network topology</p>
          </div>
        ) : (
          <svg 
            ref={svgRef} 
            width="900" 
            height="600" 
            viewBox="0 0 900 600"
            className="cursor-default"
          ></svg>
        )}
        
        <div className="absolute top-6 right-6 space-y-2">
          {viewMode === 'overview' ? (
            <>
              <div className="flex items-center space-x-2 text-sm bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
                <div className="w-3 h-3 bg-slate-900 border-2 border-blue-500 rounded"></div>
                <span className="text-slate-300 font-medium">Core Router</span>
              </div>
              <div className="flex items-center space-x-2 text-sm bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300 font-medium">Subnet</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 text-sm bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
                <div className="w-3 h-3 bg-slate-900 border-2 border-green-500 rounded"></div>
                <span className="text-slate-300 font-medium">Gateway</span>
              </div>
              <div className="flex items-center space-x-2 text-sm bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300 font-medium">Device Online</span>
              </div>
              <div className="flex items-center space-x-2 text-sm bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
                <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                <span className="text-slate-300 font-medium">Device Offline</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramView;
