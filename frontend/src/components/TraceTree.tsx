import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, Play, Loader2, Pause, FileText, Database, Share2 } from 'lucide-react';
import type { AgentNode } from '../hooks/useAgentStream';

interface TraceNodeProps {
  id: string;
  nodes: Record<string, AgentNode>;
  depth: number;
}

const TraceNode: React.FC<TraceNodeProps> = ({ id, nodes, depth }) => {
  const node = nodes[id];
  const [isExpanded, setIsExpanded] = useState(true);

  if (!node) return null;

  return (
    <div className={`ml-${depth * 4} mt-2 border-l-2 border-gray-700 pl-4 transition-all opacity-0 animate-fade-in`}>
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-gray-400 group-hover:text-white transition-colors">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        
        <div className={`
          p-1 rounded-sm 
          ${node.status === 'completed' ? 'text-green-400' : 
            node.status === 'running' ? 'text-blue-400 animate-pulse' : 
            node.status === 'paused' ? 'text-yellow-400' : 'text-gray-400'}
        `}>
          {node.status === 'completed' ? <CheckCircle size={18} /> : 
           node.status === 'running' ? <Loader2 size={18} className="animate-spin" /> : 
           node.status === 'paused' ? <Pause size={18} /> : <Play size={18} />}
        </div>

        <span className="font-semibold text-gray-200">{node.name}</span>
        <span className="text-xs text-gray-500 uppercase tracking-widest">{node.role}</span>
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Thinking steps */}
          {node.thinking.length > 0 && (
            <div className="bg-gray-800/50 rounded-md p-2 text-sm text-gray-400 italic">
              {node.thinking.map((t, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-gray-600">›</span> {t}
                </div>
              ))}
            </div>
          )}

          {/* Tools */}
          {node.tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {node.tools.map((tool, idx) => (
                <div key={idx} className="bg-blue-900/20 border border-blue-800/50 rounded px-2 py-1 text-xs flex items-center gap-2">
                  <Database size={12} className="text-blue-400" />
                  <span className="text-blue-200">{tool.name}</span>
                  {tool.output && <div className="w-1 h-1 bg-green-400 rounded-full" />}
                </div>
              ))}
            </div>
          )}

          {/* Artifacts */}
          {node.artifacts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {node.artifacts.map((art, idx) => (
                <div key={idx} className="bg-indigo-900/20 border border-indigo-800/50 rounded px-2 py-1 text-xs flex items-center gap-2 cursor-pointer hover:bg-indigo-800/40">
                  <FileText size={12} className="text-indigo-400" />
                  <span className="text-indigo-200">{art.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Question/Answer */}
          {node.question && (
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-md p-2 text-sm">
              <div className="text-yellow-400 font-bold flex items-center gap-1 mb-1">
                <Share2 size={14} /> Agent Question:
              </div>
              <p className="text-yellow-100">{node.question}</p>
              {node.answer && (
                <div className="mt-2 pl-4 border-l border-yellow-600">
                  <span className="text-gray-400">User: </span>
                  <span className="text-white">{node.answer}</span>
                </div>
              )}
            </div>
          )}

          {/* Children nodes (Recursive) */}
          <div className="pt-2">
            {node.subAgents.map(childId => (
              <TraceNode key={childId} id={childId} nodes={nodes} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TraceTree: React.FC<{ rootId: string | null; nodes: Record<string, AgentNode> }> = ({ rootId, nodes }) => {
  if (!rootId) return <div className="text-gray-500 italic p-4">No active trace...</div>;
  return (
    <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
      <div className="text-xs uppercase text-gray-500 mb-4 tracking-tighter">Live Execution Trace</div>
      <TraceNode id={rootId} nodes={nodes} depth={0} />
    </div>
  );
};
