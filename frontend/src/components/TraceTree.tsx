import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, Play, Loader2, Pause, FileText, Database, Share2 } from 'lucide-react';
import type { AgentNode } from '../hooks/useAgentStream';

interface TraceNodeProps {
  id: string;
  nodes: Record<string, AgentNode>;
  depth: number;
  onSelectTool: (name: string, output: string) => void;
  onSelectArtifact: (name: string, content: string) => void;
}

const TraceNode: React.FC<TraceNodeProps> = ({ id, nodes, depth, onSelectTool, onSelectArtifact }) => {
  const node = nodes[id];
  const [isExpanded, setIsExpanded] = useState(true);

  if (!node) return null;

  return (
    <div className={`mt-2 border-l border-white/5 ml-2 pl-4 transition-all animate-fade-in`}>
      <div 
        className="flex items-center gap-3 cursor-pointer hover:bg-white/5 py-1.5 px-2 rounded-xl transition-all group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-gray-600 group-hover:text-gray-300 transition-colors">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
        
        <div className={`
          p-1.5 rounded-lg transition-colors
          ${node.status === 'completed' ? 'text-green-500 bg-green-500/10' : 
            node.status === 'running' ? 'text-blue-500 animate-pulse bg-blue-500/10' : 
            node.status === 'paused' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-600 bg-white/5'}
        `}>
          {node.status === 'completed' ? <CheckCircle size={14} className="animate-in zoom-in duration-300" /> : 
           node.status === 'running' ? <Loader2 size={14} className="animate-spin" /> : 
           node.status === 'paused' ? <Pause size={14} /> : <Play size={14} />}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] text-gray-200 uppercase tracking-wider">{node.name}</span>
            {node.status === 'completed' && <span className="text-[9px] text-green-500/70 font-black uppercase">Ready</span>}
          </div>
          <span className="text-[9px] text-gray-600 font-mono tracking-tight">{node.role}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-1 space-y-2 pb-1">
          {/* Thinking steps - Subtle Terminal Style */}
          {node.thinking.length > 0 && (
            <div className="space-y-1">
              {node.thinking.map((t, idx) => (
                <div key={idx} className="thinking-step break-all">
                  {t}
                </div>
              ))}
            </div>
          )}

          {/* Tools */}
          {node.tools.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {node.tools.map((tool, idx) => (
                <div key={idx} 
                     onClick={(e) => { e.stopPropagation(); onSelectTool(tool.name, tool.output); }}
                     className="bg-blue-500/5 border border-blue-500/10 rounded-lg px-2.5 py-1 text-[10px] flex items-center gap-2 cursor-pointer hover:bg-blue-500/10 transition-all">
                  <Database size={12} className="text-blue-500/50" />
                  <span className="text-blue-400/80 font-bold">{tool.name}</span>
                  {tool.output && <div className="w-1 h-1 bg-green-500/50 rounded-full" />}
                </div>
              ))}
            </div>
          )}

          {/* Artifacts Summary */}
          {node.artifacts.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {node.artifacts.map((art, idx) => (
                <div key={idx} 
                     onClick={(e) => { e.stopPropagation(); onSelectArtifact(art.name, art.content); }}
                     className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg px-2.5 py-1 text-[10px] flex items-center gap-2 cursor-pointer hover:bg-indigo-500/10 transition-all">
                  <FileText size={12} className="text-indigo-500/50" />
                  <span className="text-indigo-400/80 font-bold">{art.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Question/Answer - Minimalist Overlay */}
          {node.question && (
            <div className="mx-1 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-2.5">
              <div className="text-yellow-500/60 text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5 mb-1.5">
                <Share2 size={10} /> User Feedback Required
              </div>
              <p className="text-[11px] text-yellow-100/70 leading-relaxed italic">"{node.question}"</p>
            </div>
          )}

          {/* Children nodes (Recursive) */}
          <div className="border-l border-white/5">
            {node.subAgents.map(childId => (
              <TraceNode 
                key={childId} 
                id={childId} 
                nodes={nodes} 
                depth={depth + 1} 
                onSelectTool={onSelectTool}
                onSelectArtifact={onSelectArtifact}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TraceTree: React.FC<{ 
  rootId: string | null; 
  nodes: Record<string, AgentNode>;
  onSelectTool: (name: string, output: string) => void;
  onSelectArtifact: (name: string, content: string) => void;
}> = ({ rootId, nodes, onSelectTool, onSelectArtifact }) => {
  if (!rootId) return <div className="text-gray-500 italic p-4">No active trace...</div>;
  return (
    <div className="p-4 min-h-0">
      <div className="text-xs uppercase text-gray-500 mb-4 tracking-tighter">Live Execution Trace</div>
      <TraceNode 
        id={rootId} 
        nodes={nodes} 
        depth={0} 
        onSelectTool={onSelectTool}
        onSelectArtifact={onSelectArtifact}
      />
    </div>
  );
};
