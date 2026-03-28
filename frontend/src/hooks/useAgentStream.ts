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

  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = (query: string) => {
    setNodes({});
    setRootId(null);
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setIsStreaming(true);

    const es = new EventSource(`http://localhost:3001/api/stream?q=${encodeURIComponent(query)}`);
    eventSourceRef.current = es;

    es.onerror = (e) => {
      console.error('SSE Error:', e);
      setIsStreaming(false);
      es.close();
    };

    const handlers: Record<string, (data: any) => void> = {
      session_start: (data) => {
        console.log('Session Start:', data);
      },
      agent_start: (data) => {
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
          
          const parent = updated[data.parentId];
          if (data.parentId && parent) {
            parent.subAgents = [...parent.subAgents, data.id];
          } else if (!data.parentId) {
            setRootId(data.id);
          }
          
          return updated;
        });
      },
      thinking: (data) => {
        setNodes(curr => {
          if (!curr[data.id]) return curr;
          return {
            ...curr,
            [data.id]: {
              ...curr[data.id],
              thinking: [...curr[data.id].thinking, data.text]
            }
          };
        });
      },
      tool_start: (data) => {
        setNodes(curr => {
          if (!curr[data.id]) return curr;
          return {
            ...curr,
            [data.id]: {
              ...curr[data.id],
              tools: [...curr[data.id].tools, { name: data.tool, input: data.input, output: '' }]
            }
          };
        });
      },
      tool_end: (data) => {
        setNodes(curr => {
          if (!curr[data.id]) return curr;
          const updatedTools = [...curr[data.id].tools];
          const toolIndex = updatedTools.findIndex(t => t.name === data.tool && t.output === '');
          if (toolIndex !== -1) {
            updatedTools[toolIndex] = { ...updatedTools[toolIndex], output: data.output };
          }
          return {
            ...curr,
            [data.id]: {
              ...curr[data.id],
              tools: updatedTools
            }
          };
        });
      },
      ask_user: (data) => {
        setNodes(curr => ({
          ...curr,
          [data.id]: { ...curr[data.id], status: 'paused', question: data.question }
        }));
      },
      user_answer: (data) => {
        setNodes(curr => ({
          ...curr,
          [data.id]: { ...curr[data.id], status: 'running', answer: data.answer }
        }));
        setMessages(prev => [...prev, { role: 'user', text: `Answer: ${data.answer}` }]);
      },
      agent_end: (data) => {
        setNodes(curr => {
          if (!curr[data.id]) return curr;
          return {
            ...curr,
            [data.id]: { ...curr[data.id], status: 'completed', response: data.output }
          };
        });
      },
      agent_response: (data) => {
        setMessages(prev => [...prev, { role: 'agent', text: data.text }]);
      },
      artifact: (data) => {
        setNodes(curr => {
          if (!curr[data.id]) return curr;
          return {
            ...curr,
            [data.id]: {
              ...curr[data.id],
              artifacts: [...curr[data.id].artifacts, { name: data.name, type: data.type, content: data.content }]
            }
          };
        });
      },
      done: () => {
        setIsStreaming(false);
        es.close();
      }
    };

    Object.entries(handlers).forEach(([type, handler]) => {
      es.addEventListener(type, (e) => {
        const data = JSON.parse((e as any).data);
        handler(data);
      });
    });
  };

  return { nodes, rootId, messages, isStreaming, startStream };
};
