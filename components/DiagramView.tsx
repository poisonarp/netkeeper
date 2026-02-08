import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Subnet, IPAddress, DeviceType } from '../types.ts';
import * as d3 from 'd3';

interface DiagramViewProps {
  subnets: Subnet[];
  ipAddresses: IPAddress[];
  setIpAddresses?: React.Dispatch<React.SetStateAction<IPAddress[]>>;
}

interface NetworkNode {
  id: string;
  type: 'internet' | 'router' | 'switch' | 'firewall' | 'gateway' | 'device';
  deviceType?: DeviceType;
  label: string;
  ip?: string;
  subnetId?: string;
  isOnline?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  layer: number;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  connectionType: 'wired' | 'wireless' | 'virtual';
}

const deviceTypeLabels: Record<DeviceType, string> = {
  router: 'Router',
  switch: 'Switch',
  firewall: 'Firewall',
  server: 'Server',
  desktop: 'Desktop',
  laptop: 'Laptop',
  phone: 'Phone/Mobile',
  iot: 'IoT Device',
  printer: 'Printer',
  camera: 'Camera',
  ap: 'Access Point',
  nas: 'NAS Storage',
  vm: 'Virtual Machine',
  container: 'Container',
  unknown: 'Unknown'
};

const deviceTypeIcons: Record<DeviceType | 'internet' | 'gateway', string> = {
  internet: '🌐',
  gateway: '🔀',
  router: '📡',
  switch: '🔌',
  firewall: '🛡️',
  server: '🖥️',
  desktop: '💻',
  laptop: '💻',
  phone: '📱',
  iot: '📟',
  printer: '🖨️',
  camera: '📷',
  ap: '📶',
  nas: '💾',
  vm: '☁️',
  container: '📦',
  unknown: '❓'
};

const DiagramView: React.FC<DiagramViewProps> = ({ subnets, ipAddresses, setIpAddresses }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IPAddress | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'subnet'>('full');
  const [selectedSubnetId, setSelectedSubnetId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const getInfrastructureDevices = useCallback(() => {
    return ipAddresses.filter(ip => 
      ['router', 'switch', 'firewall', 'ap'].includes(ip.deviceType || '')
    );
  }, [ipAddresses]);

  const buildNetworkGraph = useCallback(() => {
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    // Layer 0: Internet
    nodes.push({
      id: 'INTERNET',
      type: 'internet',
      label: 'Internet',
      layer: 0
    });

    // Layer 1: Main router/firewall
    const mainRouter = ipAddresses.find(ip => ip.deviceType === 'router') || 
                       ipAddresses.find(ip => ip.deviceType === 'firewall');
    
    if (mainRouter) {
      nodes.push({
        id: mainRouter.id,
        type: 'router',
        deviceType: mainRouter.deviceType,
        label: mainRouter.hostname || 'Main Router',
        ip: mainRouter.address,
        isOnline: mainRouter.isOnline,
        layer: 1
      });
      links.push({
        source: 'INTERNET',
        target: mainRouter.id,
        connectionType: 'wired'
      });
    } else {
      if (subnets.length > 0) {
        nodes.push({
          id: 'MAIN_ROUTER',
          type: 'router',
          label: 'Core Router',
          ip: subnets[0].gateway,
          layer: 1
        });
        links.push({
          source: 'INTERNET',
          target: 'MAIN_ROUTER',
          connectionType: 'wired'
        });
      }
    }

    const mainRouterId = mainRouter?.id || 'MAIN_ROUTER';

    // Layer 2: Switches and Access Points
    const switches = ipAddresses.filter(ip => ip.deviceType === 'switch');
    const accessPoints = ipAddresses.filter(ip => ip.deviceType === 'ap');
    
    switches.forEach(sw => {
      if (sw.id !== mainRouter?.id) {
        nodes.push({
          id: sw.id,
          type: 'switch',
          deviceType: 'switch',
          label: sw.hostname || 'Switch',
          ip: sw.address,
          isOnline: sw.isOnline,
          subnetId: sw.subnetId,
          layer: 2
        });
        const parentId = sw.parentDeviceId || mainRouterId;
        if (nodes.find(n => n.id === parentId) || parentId === mainRouterId) {
          links.push({
            source: parentId,
            target: sw.id,
            connectionType: sw.connectionType || 'wired'
          });
        }
      }
    });

    accessPoints.forEach(ap => {
      nodes.push({
        id: ap.id,
        type: 'device',
        deviceType: 'ap',
        label: ap.hostname || 'Access Point',
        ip: ap.address,
        isOnline: ap.isOnline,
        subnetId: ap.subnetId,
        layer: 2
      });
      const parentId = ap.parentDeviceId || 
                       switches.find(s => s.subnetId === ap.subnetId)?.id || 
                       mainRouterId;
      if (nodes.find(n => n.id === parentId) || parentId === mainRouterId) {
        links.push({
          source: parentId,
          target: ap.id,
          connectionType: 'wired'
        });
      }
    });

    // Layer 3: End devices
    const endDevices = ipAddresses.filter(ip => 
      !['router', 'switch', 'firewall', 'ap'].includes(ip.deviceType || '') &&
      ip.id !== mainRouter?.id
    );

    endDevices.forEach(device => {
      nodes.push({
        id: device.id,
        type: 'device',
        deviceType: device.deviceType || 'unknown',
        label: device.hostname || device.address,
        ip: device.address,
        isOnline: device.isOnline,
        subnetId: device.subnetId,
        layer: 3
      });

      let parentId: string;
      if (device.parentDeviceId) {
        parentId = device.parentDeviceId;
      } else if (device.connectionType === 'wireless') {
        const ap = accessPoints.find(a => a.subnetId === device.subnetId) || accessPoints[0];
        parentId = ap?.id || switches.find(s => s.subnetId === device.subnetId)?.id || mainRouterId;
      } else {
        const sw = switches.find(s => s.subnetId === device.subnetId);
        parentId = sw?.id || mainRouterId;
      }

      if (nodes.find(n => n.id === parentId) || parentId === mainRouterId) {
        links.push({
          source: parentId,
          target: device.id,
          connectionType: device.connectionType || 'wired'
        });
      }
    });

    return { nodes, links };
  }, [ipAddresses, subnets]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 1000;
    const height = 700;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { nodes, links } = buildNetworkGraph();

    if (nodes.length === 0) return;

    let filteredNodes = nodes;
    let filteredLinks = links;
    
    if (viewMode === 'subnet' && selectedSubnetId) {
      const subnetDeviceIds = new Set(
        nodes.filter(n => n.subnetId === selectedSubnetId || n.layer <= 1).map(n => n.id)
      );
      filteredNodes = nodes.filter(n => subnetDeviceIds.has(n.id));
      filteredLinks = links.filter(l => {
        const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
        const targetId = typeof l.target === 'string' ? l.target : l.target.id;
        return subnetDeviceIds.has(sourceId) && subnetDeviceIds.has(targetId);
      });
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    const g = svg.append('g');

    svg.append('defs').selectAll('marker')
      .data(['wired', 'wireless', 'virtual'])
      .join('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 30)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', d => d === 'wireless' ? '#8b5cf6' : d === 'virtual' ? '#06b6d4' : '#64748b')
      .attr('d', 'M0,-5L10,0L0,5');

    const simulation = d3.forceSimulation<NetworkNode>(filteredNodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(filteredLinks)
        .id(d => d.id)
        .distance(d => {
          const source = d.source as NetworkNode;
          const target = d.target as NetworkNode;
          return 100 + Math.abs(source.layer - target.layer) * 50;
        })
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('y', d3.forceY<NetworkNode>()
        .y(d => 80 + d.layer * 160)
        .strength(0.3)
      )
      .force('collision', d3.forceCollide().radius(50));

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('stroke', d => d.connectionType === 'wireless' ? '#8b5cf6' : d.connectionType === 'virtual' ? '#06b6d4' : '#475569')
      .attr('stroke-width', d => d.connectionType === 'wireless' ? 2 : 2.5)
      .attr('stroke-dasharray', d => d.connectionType === 'wireless' ? '5,5' : d.connectionType === 'virtual' ? '3,3' : 'none')
      .attr('opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-${d.connectionType})`);

    const linkLabels = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(filteredLinks.filter(l => l.connectionType === 'wireless'))
      .join('text')
      .attr('fill', '#8b5cf6')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .text('WiFi');

    const nodeGroup = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    nodeGroup.append('circle')
      .attr('r', d => {
        if (d.type === 'internet') return 35;
        if (d.layer === 1) return 32;
        if (d.layer === 2) return 28;
        return 24;
      })
      .attr('fill', d => {
        if (d.type === 'internet') return '#1e40af';
        if (d.deviceType === 'router') return '#059669';
        if (d.deviceType === 'switch') return '#0891b2';
        if (d.deviceType === 'firewall') return '#dc2626';
        if (d.deviceType === 'ap') return '#7c3aed';
        if (d.deviceType === 'server') return '#0f766e';
        if (d.isOnline === false) return '#64748b';
        return '#3b82f6';
      })
      .attr('stroke', d => {
        if (d.isOnline === false) return '#94a3b8';
        if (d.type === 'internet') return '#3b82f6';
        return '#fff';
      })
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))');

    nodeGroup.filter(d => d.type === 'device' || d.layer > 0)
      .append('circle')
      .attr('r', 6)
      .attr('cx', d => (d.layer === 1 ? 24 : d.layer === 2 ? 21 : 18))
      .attr('cy', d => (d.layer === 1 ? -24 : d.layer === 2 ? -21 : -18))
      .attr('fill', d => d.isOnline === true ? '#22c55e' : d.isOnline === false ? '#ef4444' : '#94a3b8')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2);

    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.type === 'internet' ? 8 : 6)
      .attr('font-size', d => d.layer <= 1 ? '22px' : d.layer === 2 ? '18px' : '16px')
      .text(d => {
        if (d.type === 'internet') return deviceTypeIcons.internet;
        if (d.type === 'router' || d.type === 'gateway') return deviceTypeIcons[d.deviceType || 'router'];
        return deviceTypeIcons[d.deviceType || 'unknown'];
      });

    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.layer <= 1 ? 50 : d.layer === 2 ? 45 : 40))
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(d => {
        const label = d.label;
        return label.length > 15 ? label.substring(0, 14) + '…' : label;
      });

    nodeGroup.filter(d => d.ip)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.layer <= 1 ? 65 : d.layer === 2 ? 58 : 53))
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(d => d.ip || '');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NetworkNode).x || 0)
        .attr('y1', d => (d.source as NetworkNode).y || 0)
        .attr('x2', d => (d.target as NetworkNode).x || 0)
        .attr('y2', d => (d.target as NetworkNode).y || 0);

      linkLabels
        .attr('x', d => ((d.source as NetworkNode).x! + (d.target as NetworkNode).x!) / 2)
        .attr('y', d => ((d.source as NetworkNode).y! + (d.target as NetworkNode).y!) / 2 - 5);

      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    svg.on('click', () => setSelectedNode(null));

    return () => {
      simulation.stop();
    };
  }, [buildNetworkGraph, viewMode, selectedSubnetId]);

  const handleUpdateDeviceConnection = (deviceId: string, parentDeviceId: string | undefined, connectionType: 'wired' | 'wireless') => {
    if (!setIpAddresses) return;
    
    setIpAddresses(prev => prev.map(ip => 
      ip.id === deviceId 
        ? { ...ip, parentDeviceId, connectionType }
        : ip
    ));
    setShowConnectionModal(false);
    setEditingDevice(null);
  };

  const handleUpdateDeviceType = (deviceId: string, deviceType: DeviceType) => {
    if (!setIpAddresses) return;
    
    setIpAddresses(prev => prev.map(ip => 
      ip.id === deviceId 
        ? { ...ip, deviceType }
        : ip
    ));
  };

  const infraDevices = getInfrastructureDevices();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-400 drop-shadow">Network Topology</h1>
          <p className="text-slate-400 text-base mt-1">
            Interactive network diagram showing device connections. Drag nodes to reposition, scroll to zoom.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={viewMode === 'full' ? 'full' : selectedSubnetId || ''}
            onChange={(e) => {
              if (e.target.value === 'full') {
                setViewMode('full');
                setSelectedSubnetId(null);
              } else {
                setViewMode('subnet');
                setSelectedSubnetId(e.target.value);
              }
            }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200"
          >
            <option value="full">Full Network</option>
            {subnets.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.cidr})</option>
            ))}
          </select>
          <span className="text-sm text-slate-500">Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/70 backdrop-blur-lg p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-500 uppercase">Total Devices</p>
          <p className="text-2xl font-bold text-cyan-400">{ipAddresses.length}</p>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-4 rounded-xl border border-green-500/20">
          <p className="text-xs text-green-500 uppercase">Online</p>
          <p className="text-2xl font-bold text-green-400">{ipAddresses.filter(ip => ip.isOnline).length}</p>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-500 uppercase">Routers</p>
          <p className="text-2xl font-bold text-cyan-400">{ipAddresses.filter(ip => ip.deviceType === 'router').length}</p>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-500 uppercase">Switches</p>
          <p className="text-2xl font-bold text-cyan-400">{ipAddresses.filter(ip => ip.deviceType === 'switch').length}</p>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-lg p-4 rounded-xl border border-purple-500/20">
          <p className="text-xs text-purple-400 uppercase">Wireless</p>
          <p className="text-2xl font-bold text-purple-400">{ipAddresses.filter(ip => ip.connectionType === 'wireless').length}</p>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="bg-slate-900/80 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-800 overflow-hidden relative"
        style={{ minHeight: '700px' }}
      >
        {ipAddresses.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[700px]">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="text-xl font-bold text-slate-400 mb-2">No Devices Found</h3>
              <p className="text-slate-500">Add IP addresses in the IPAM view to see the network topology</p>
            </div>
          </div>
        ) : (
          <svg 
            ref={svgRef} 
            width="100%" 
            height="700"
            className="cursor-grab active:cursor-grabbing"
          />
        )}

        <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Device Types</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-800 border-2 border-blue-500" />
              <span className="text-slate-300">Internet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-600" />
              <span className="text-slate-300">Router</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-cyan-600" />
              <span className="text-slate-300">Switch</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-600" />
              <span className="text-slate-300">Firewall</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-violet-600" />
              <span className="text-slate-300">Access Point</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-500" />
              <span className="text-slate-300">Device</span>
            </div>
          </div>
          <hr className="border-slate-700 my-2" />
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Connection Types</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-8 h-0.5 bg-slate-500" />
              <span className="text-slate-300">Wired</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-0.5 bg-purple-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8b5cf6, #8b5cf6 3px, transparent 3px, transparent 6px)' }} />
              <span className="text-slate-300">Wireless</span>
            </div>
          </div>
          <hr className="border-slate-700 my-2" />
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Status</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-300">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-300">Offline</span>
            </div>
          </div>
        </div>

        {selectedNode && selectedNode.type !== 'internet' && (
          <div className="absolute bottom-4 left-4 bg-slate-800/95 backdrop-blur-sm rounded-xl p-4 border border-slate-700 w-80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-200">{selectedNode.label}</h4>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">IP Address</span>
                <span className="font-mono text-slate-300">{selectedNode.ip || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Device Type</span>
                <span className="text-slate-300">{deviceTypeLabels[selectedNode.deviceType || 'unknown']}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <span className={`flex items-center gap-1.5 ${selectedNode.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${selectedNode.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  {selectedNode.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            {setIpAddresses && (
              <button
                onClick={() => {
                  const device = ipAddresses.find(ip => ip.id === selectedNode.id);
                  if (device) {
                    setEditingDevice(device);
                    setShowConnectionModal(true);
                  }
                }}
                className="mt-4 w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Edit Connection
              </button>
            )}
          </div>
        )}
      </div>

      {setIpAddresses && (
        <div className="bg-slate-900/70 backdrop-blur-lg rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-cyan-400 mb-4">Quick Device Type Assignment</h3>
          <p className="text-sm text-slate-500 mb-4">
            Assign device types to improve topology accuracy. Infrastructure devices (routers, switches, APs) will automatically become connection points.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {ipAddresses.slice(0, 20).map(device => (
              <div key={device.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${device.isOnline ? 'bg-green-500/20' : 'bg-slate-700'}`}>
                  {deviceTypeIcons[device.deviceType || 'unknown']}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{device.hostname || device.address}</p>
                  <p className="text-xs text-slate-500 font-mono">{device.address}</p>
                </div>
                <select
                  value={device.deviceType || 'unknown'}
                  onChange={(e) => handleUpdateDeviceType(device.id, e.target.value as DeviceType)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  {Object.entries(deviceTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {ipAddresses.length > 20 && (
            <p className="text-xs text-slate-500 mt-3 text-center">
              Showing first 20 devices. Use IPAM view to manage all devices.
            </p>
          )}
        </div>
      )}

      {showConnectionModal && editingDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Edit Device Connection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Device</label>
                <p className="text-slate-200 font-medium">{editingDevice.hostname || editingDevice.address}</p>
                <p className="text-xs text-slate-500 font-mono">{editingDevice.address}</p>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Connected To</label>
                <select
                  value={editingDevice.parentDeviceId || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, parentDeviceId: e.target.value || undefined })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-200"
                >
                  <option value="">Auto (based on subnet)</option>
                  {infraDevices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.hostname || d.address} ({deviceTypeLabels[d.deviceType || 'unknown']})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Connection Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingDevice({ ...editingDevice, connectionType: 'wired' })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      editingDevice.connectionType !== 'wireless'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    🔌 Wired
                  </button>
                  <button
                    onClick={() => setEditingDevice({ ...editingDevice, connectionType: 'wireless' })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      editingDevice.connectionType === 'wireless'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    📶 Wireless
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConnectionModal(false);
                  setEditingDevice(null);
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateDeviceConnection(
                  editingDevice.id,
                  editingDevice.parentDeviceId,
                  editingDevice.connectionType || 'wired'
                )}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagramView;
