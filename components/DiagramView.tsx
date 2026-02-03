
import React, { useEffect, useRef } from 'react';
import { Subnet } from '../types.ts';
import * as d3 from 'd3';

interface DiagramViewProps {
  subnets: Subnet[];
}

const DiagramView: React.FC<DiagramViewProps> = ({ subnets }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || subnets.length === 0) return;

    const width = 800;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes = [
      { id: 'CORE_ROUTER', type: 'router', label: 'Core Gateway', group: 1 },
      ...subnets.map(s => ({ id: s.id, type: 'subnet', label: s.name, group: 2 }))
    ];

    const links = subnets.map(s => ({
      source: 'CORE_ROUTER',
      target: s.id
    }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    node.append("circle")
      .attr("r", (d: any) => d.type === 'router' ? 24 : 16)
      .attr("fill", (d: any) => d.type === 'router' ? '#1e293b' : '#3b82f6');

    node.append("text")
      .text((d: any) => d.label)
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .style("font-size", "12px")
      .style("font-weight", "600");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

  }, [subnets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Network Topology</h1>
        <p className="text-slate-500">Auto-generated interactive map of your infrastructure.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 overflow-hidden relative min-h-[600px] flex items-center justify-center">
        <svg 
          ref={svgRef} 
          width="800" 
          height="500" 
          viewBox="0 0 800 500"
          className="cursor-grab active:cursor-grabbing"
        ></svg>
        
        <div className="absolute top-6 right-6 space-y-2">
           <div className="flex items-center space-x-2 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
             <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
             <span className="text-slate-600 font-medium">Gateway Node</span>
           </div>
           <div className="flex items-center space-x-2 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
             <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
             <span className="text-slate-600 font-medium">Subnet Zone</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramView;
