import { useState } from 'react';
import { Send, Search, Terminal, Box, X, FileText, Download, Sparkles, Activity, Archive, Loader2, MessageSquare, ChevronRight, AlertCircle } from 'lucide-react';
import { useAgentStream } from './hooks/useAgentStream';
import { TraceTree } from './components/TraceTree';
import { ReportGallery } from './components/ReportGallery';
import './index.css';

function App() {
  const { 
    nodes, 
    rootId, 
    messages, 
    isStreaming, 
    error,
    startStream, 
    submitAnswer 
  } = useAgentStream();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isMock, setIsMock] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<{name: string, content: string} | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;
    startStream(query, isMock);
    setQuery('');
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !isStreaming) return;
    submitAnswer(answer);
    setAnswer('');
  };

  const activeQuestionNode = Object.values(nodes).find(n => n.status === 'paused');

  return (
    <div className="flex flex-col h-screen w-full bg-[#0d1117] text-white overflow-hidden p-5 gap-5 relative font-sans selection:bg-indigo-500/30">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full -z-10" />

      {/* Simplified, Clean Header */}
      <header className="flex items-center justify-between px-6 py-4 glass-dark rounded-2xl h-[90px] border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600/10 p-3 rounded-xl border border-indigo-500/20 shadow-lg">
            <Sparkles size={28} className="text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <h1 className="header-title">Deep Analyst</h1>
            <p className="text-[10px] text-indigo-400/50 font-mono tracking-[0.3em] uppercase">Intelligence Engine v2.0</p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer select-none group"
               onClick={() => setIsMock(!isMock)}>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${isMock ? 'bg-indigo-600' : 'bg-gray-800'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isMock ? 'left-4.5' : 'left-0.5'}`} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Mock Mode</span>
          </div>

          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
              {isStreaming ? 'Streaming' : 'Standby'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace - Strict 12-Column Grid */}
      <main className="flex-1 grid grid-cols-12 gap-5 min-h-0">
        
        {/* Left: Trace Panel (3 cols) */}
        <div className="col-span-3 flex flex-col glass-dark rounded-2xl border-white/5 overflow-hidden shadow-lg">
          <div className="border-b border-white/10 p-4 flex items-center gap-3 bg-white/5">
            <Activity size={16} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Execution Trace</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <TraceTree 
              rootId={rootId} 
              nodes={nodes} 
              onSelectTool={(name, output) => setSelectedArtifact({ name, content: output })}
              onSelectArtifact={(name, content) => setSelectedArtifact({ name, content })}
            />
          </div>
        </div>

        {/* Middle: Research Workspace (6 cols) */}
        <div className="col-span-6 flex flex-col gap-5 min-w-0">
          
          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-lg backdrop-blur-md">
              <AlertCircle className="text-red-500" size={24} />
              <div className="flex-1">
                <p className="text-red-500 font-bold text-sm">System Interruption</p>
                <p className="text-red-400 text-xs opacity-80">{error}</p>
              </div>
              <button onClick={() => window.location.reload()} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-lg text-[10px] font-bold uppercase transition-all">
                Reload
              </button>
            </div>
          )}

          {/* Integrated Search Container */}
          <div className="glass-dark p-3 rounded-2xl border-white/5 shadow-xl">
            <form onSubmit={handleSubmit} className="input-container">
              <Search size={20} className="ml-3 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Submit your research command..."
                className="input-transparent"
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!query.trim() || isStreaming}
                className="btn-adornment"
              >
                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={18} />}
                <span>{isStreaming ? 'Working' : 'Run'}</span>
              </button>
            </form>
          </div>

          {/* Context Feed */}
          <div className="flex-1 glass-dark rounded-2xl border-white/5 flex flex-col overflow-hidden relative shadow-inner">
            <div className="border-b border-white/5 p-4 flex items-center gap-3 bg-white/5">
              <Terminal size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.20em] text-gray-400">Context Workspace</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-10">
                  <Box size={80} strokeWidth={1} className="mb-4" />
                  <p className="text-sm font-medium tracking-tight">Awaiting research command initiation...</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-md transition-all ${
                      m.role === 'user' 
                      ? 'bg-indigo-600/10 border border-indigo-500/20 text-white rounded-tr-none' 
                      : 'bg-[#161b22] border border-white/5 text-gray-100 rounded-tl-none'
                    }`}>
                      <div className="text-[9px] uppercase font-bold text-indigo-400/50 mb-1 tracking-widest">
                        {m.role === 'user' ? 'Command' : 'Synthesis'}
                      </div>
                      <div className="text-md leading-relaxed">
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Action Pause Overlay (Centered properly) */}
              {activeQuestionNode && (
                <div className="mx-2 my-4 animate-fade-in">
                  <form onSubmit={handleAnswerSubmit} className="glass-dark border-yellow-500/30 rounded-2xl p-6 shadow-2xl border-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-500">
                        <MessageSquare size={20} />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-white">Action Required</h4>
                    </div>
                    
                    <p className="text-sm text-yellow-100/80 mb-5 pl-3 border-l-2 border-yellow-500/20 italic">
                      {activeQuestionNode.question}
                    </p>

                    <div className="input-container border-yellow-500/20">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Provide answer..."
                        className="input-transparent py-2"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!answer.trim()}
                        className="btn-adornment bg-yellow-600 hover:bg-yellow-500 text-black shadow-yellow-600/20"
                      >
                        <Send size={14} />
                        <span>Resume</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results Gallery (3 cols) */}
        <div className="col-span-3 flex flex-col glass-dark rounded-2xl border-white/5 overflow-hidden shadow-lg">
          <div className="border-b border-white/10 p-4 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <Archive size={16} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Library</span>
            </div>
          </div>
          <ReportGallery 
            nodes={nodes} 
            onSelectReport={(name, content) => setSelectedArtifact({ name, content })}
          />
        </div>

      </main>

      {/* Artifact Viewer (Modal) */}
      {selectedArtifact && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-12 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b0e14] border border-white/10 rounded-3xl w-full max-w-4xl h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-indigo-400" />
                <h3 className="text-lg font-bold text-gray-100 uppercase tracking-tight">{selectedArtifact.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const sanitizedName = selectedArtifact.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    const timestamp = new Date().toISOString().split('T')[0];
                    const reportText = `# ${selectedArtifact.name}\n\nGenerated on: ${timestamp}\n---\n\n${selectedArtifact.content}`;
                    const blob = new Blob([reportText], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `research_report_${sanitizedName}_${timestamp}.md`;
                    a.click();
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Download size={14} />
                  Download Report
                </button>
                <button 
                  onClick={() => setSelectedArtifact(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-black/60 min-h-0">
              <pre className="whitespace-pre-wrap font-mono text-indigo-400/80 leading-relaxed text-sm p-8 bg-[#0d1117]/50 rounded-2xl border border-white/5">
                {selectedArtifact.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
