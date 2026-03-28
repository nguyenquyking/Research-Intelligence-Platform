import { useState } from 'react';
import { Send, Search, Terminal, Layers, Box, Info, X, FileText } from 'lucide-react';
import { useAgentStream } from './hooks/useAgentStream';
import { TraceTree } from './components/TraceTree';
import './index.css';

function App() {
  const [query, setQuery] = useState('');
  const [isMock, setIsMock] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<{name: string, content: string} | null>(null);
  const { nodes, rootId, messages, isStreaming, startStream } = useAgentStream();

  const handleSend = () => {
    if (!query.trim()) return;
    startStream(query, isMock);
    setQuery('');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-white overflow-hidden p-4 gap-4 relative">
      {/* Header */}
      <header className="flex items-center justify-between p-4 glass rounded-lg h-[80px]">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Search size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Deep Analyst <span className="text-indigo-500">AI</span></h1>
            <p className="text-xs text-gray-500">Research Intelligence Platform v1.0</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer select-none"
               onClick={() => setIsMock(!isMock)}>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isMock ? 'bg-indigo-600' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${isMock ? 'left-[1.125rem]' : 'left-0.5'}`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isMock ? 'text-indigo-400' : 'text-gray-500'}`}>
              Demo Mode {isMock ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs font-semibold text-gray-300">
              {isStreaming ? 'Agent Active' : 'System Idle'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 h-full min-h-0">
        {/* Left: Chat & Settings */}
        <div className="flex flex-col w-[400px] gap-4">
          <div className="flex-1 flex flex-col glass rounded-lg overflow-hidden">
            <div className="border-b border-white/5 p-4 flex items-center gap-2 bg-white/5">
              <Terminal size={16} className="text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Context Window</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                  <Box size={48} className="mb-4 text-gray-600" />
                  <p className="text-sm">Initiate a research query to see the agent's live reasoning and tool interactions.</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      m.role === 'user' 
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for research (e.g. AI Market Trends...)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-600"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Trace & Artifacts */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 glass rounded-lg overflow-hidden flex flex-col">
            <div className="border-b border-white/5 p-4 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Agent Trace Tree</span>
              </div>
              <div className="flex items-center gap-2">
                <Info size={14} className="text-gray-600 hover:text-gray-400 cursor-help" />
              </div>
            </div>
            <TraceTree 
              rootId={rootId} 
              nodes={nodes} 
              onSelectTool={(name, output) => setSelectedArtifact({ name, content: output })}
              onSelectArtifact={(name, content) => setSelectedArtifact({ name, content })}
            />
          </div>
        </div>
      </div>
      
      {/* Footer / Status Bar */}
      <footer className="h-[30px] flex items-center justify-between px-4 glass rounded-lg text-[10px] text-gray-500">
        <div className="flex items-center gap-4">
          <span>Latency: 45ms</span>
          <span>Tokens: --</span>
          <span>Protocol: SSE/HTTP/2</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Accelerate Data Capstone</span>
          <div className="w-1 h-1 bg-gray-700 rounded-full" />
          <span>Quy Nguyen</span>
        </div>
      </footer>

      {/* Artifact Modal */}
      {selectedArtifact && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-[#161b22] border border-white/10 rounded-2xl w-full max-w-4xl h-full flex flex-col shadow-2xl overflow-hidden shadow-indigo-500/10">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-indigo-400" />
                <h3 className="text-lg font-bold text-gray-100">{selectedArtifact.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedArtifact(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed text-sm">
                  {selectedArtifact.content || 'Generating content... Please wait.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
