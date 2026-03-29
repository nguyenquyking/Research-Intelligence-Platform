import { useState, useRef } from 'react';

export type AgentEvent = {
  type: string;
  id: string;
  name?: string;
  role?: string;
  parentId?: string;
  text?: string;
  tool?: string;
  input?: string;
  output?: string;
  question?: string;
  answer?: string;
  artifactName?: string;
  artifactType?: string;
  content?: string;
  sessionId?: string;
};

export type AgentNode = {
  id: string;
  name: string;
  role: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  thinking: string[];
  tools: { name: string; input: string; output: string }[];
  artifacts: { name: string; type: string; content: string }[];
  subAgents: string[]; // Child IDs
  response?: string;
  question?: string;
  answer?: string;
};

export const useAgentStream = () => {
  const [nodes, setNodes] = useState<Record<string, AgentNode>>({});
  const [rootId, setRootId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const processEvent = (type: string, data: any) => {
    switch (type) {
      case 'session_start':
        setError(null);
        setCurrentSessionId(data.sessionId);
        break;
      case 'agent_start':
        setNodes(curr => {
          const newNode: AgentNode = {
            id: data.id,
            name: data.name || 'Agent',
            role: data.role || 'researcher',
            status: 'running',
            thinking: [],
            tools: [],
            artifacts: [],
            subAgents: []
          };
          const updated: Record<string, AgentNode> = { ...curr, [data.id]: newNode };
          const parent = data.parentId ? updated[data.parentId] : undefined;
          if (data.parentId && parent) {
            updated[data.parentId] = { ...parent, subAgents: [...parent.subAgents, data.id] };
          } else if (!data.parentId) {
            setRootId(data.id);
          }
          return updated;
        });
        break;
      case 'thinking':
        setNodes(curr => curr[data.id] ? {
          ...curr,
          [data.id]: { ...curr[data.id], thinking: [...curr[data.id].thinking, data.text] }
        } : curr);
        break;
      case 'tool_start':
        setNodes(curr => curr[data.id] ? {
          ...curr,
          [data.id]: { ...curr[data.id], tools: [...curr[data.id].tools, { name: data.tool, input: data.input, output: '' }] }
        } : curr);
        break;
      case 'tool_end':
        setNodes(curr => {
          if (!curr[data.id]) return curr;
          const tools = [...curr[data.id].tools];
          const idx = tools.findIndex(t => t.name === data.tool && t.output === '');
          if (idx !== -1) tools[idx] = { ...tools[idx], output: data.output };
          return { ...curr, [data.id]: { ...curr[data.id], tools } };
        });
        break;
      case 'ask_user':
        setNodes(curr => curr[data.id] ? ({
          ...curr,
          [data.id]: { ...curr[data.id], status: 'paused', question: data.question }
        }) : curr);
        break;
      case 'user_answer':
        setNodes(curr => curr[data.id] ? ({
          ...curr,
          [data.id]: { ...curr[data.id], status: 'running', answer: data.answer }
        }) : curr);
        setMessages(prev => [...prev, { role: 'user', text: `Answer: ${data.answer}` }]);
        break;
      case 'agent_response':
        setNodes(curr => curr[data.id] ? ({
          ...curr,
          [data.id]: { ...curr[data.id], status: 'completed', response: data.text }
        }) : curr);
        setMessages(prev => [...prev, { role: 'agent', text: data.text }]);
        break;
      case 'agent_end':
        setNodes(curr => curr[data.id] || curr[data.parentId] ? ({
          ...curr,
          [data.id || data.parentId]: { ...curr[data.id || data.parentId], status: 'completed' }
        }) : curr);
        break;
      case 'artifact':
        setNodes(curr => curr[data.id] ? {
          ...curr,
          [data.id]: { ...curr[data.id], artifacts: [...curr[data.id].artifacts, { name: data.name, type: data.type, content: data.content }] }
        } : curr);
        break;
      case 'done':
        setNodes(curr => {
          const updated = { ...curr };
          Object.keys(updated).forEach(id => {
            if (updated[id].status === 'running') updated[id].status = 'completed';
          });
          return updated;
        });
        setIsStreaming(false);
        break;
      case 'error':
        setError(data.message);
        setMessages(prev => [...prev, { role: 'agent', text: `⚠️ Error: ${data.message}` }]);
        setIsStreaming(false);
        break;
    }
  };

  const startStream = (query: string, isMock: boolean = false) => {
    setError(null);
    setNodes({});
    setRootId(null);
    setMessages([{ role: 'user', text: query }]);
    setIsStreaming(true);

    const es = new EventSource(`http://localhost:3001/api/stream?q=${encodeURIComponent(query)}&mock=${isMock}`);
    eventSourceRef.current = es;

    ['session_start', 'agent_start', 'thinking', 'tool_start', 'tool_end', 'ask_user', 'user_answer', 'agent_response', 'artifact', 'done', 'error'].forEach(type => {
      es.addEventListener(type, (e: any) => processEvent(type, JSON.parse(e.data)));
    });

    es.onerror = () => { es.close(); setIsStreaming(false); };
  };

  const submitAnswer = async (answer: string) => {
    if (!currentSessionId) return;
    setIsStreaming(true);

    const response = await fetch('http://localhost:3001/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSessionId, answer })
    });

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) currentEvent = line.replace('event: ', '');
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.replace('data: ', ''));
          processEvent(currentEvent, data);
        }
      }
    }
    setIsStreaming(false);
  };

  return { nodes, rootId, messages, isStreaming, error, currentSessionId, startStream, submitAnswer };
};
