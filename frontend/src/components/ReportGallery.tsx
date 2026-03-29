import React from 'react';
import { FileText, Download, Clock, ExternalLink, Archive } from 'lucide-react';
import type { AgentNode } from '../hooks/useAgentStream';

interface ReportGalleryProps {
  nodes: Record<string, AgentNode>;
  onSelectReport: (name: string, content: string) => void;
}

export const ReportGallery: React.FC<ReportGalleryProps> = ({ nodes, onSelectReport }) => {
  // Extract all artifacts from all nodes
  const allArtifacts = Object.values(nodes).flatMap(node => 
    node.artifacts.map(art => ({ ...art, agentName: node.name }))
  );

  const handleDownload = (e: React.MouseEvent, name: string, content: string) => {
    e.stopPropagation();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}_${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (allArtifacts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-30">
        <Archive size={48} className="mb-4" />
        <p className="text-sm font-medium">Final reports and data artifacts will appear here as they are generated.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
      <div className="text-[10px] uppercase text-gray-500 mb-2 tracking-[0.2em] font-bold">Generated Artifacts</div>
      <div className="grid gap-4">
        {allArtifacts.map((art, idx) => (
          <div 
            key={idx}
            onClick={() => onSelectReport(art.name, art.content)}
            className="report-card group animate-fade-in"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-100">{art.name}</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock size={10} /> Just now • {art.agentName}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => handleDownload(e, art.name, art.content)}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Download Markdown"
              >
                <Download size={16} />
              </button>
            </div>
            
            <div className="mt-2 text-[11px] text-gray-400 line-clamp-2 leading-relaxed bg-black/20 p-2 rounded-md border border-white/5">
              {art.content.slice(0, 150)}...
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded-full text-gray-500 uppercase font-bold tracking-widest">{art.type}</span>
              <div className="flex items-center gap-1 text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Full Report</span>
                <ExternalLink size={10} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
