const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from .env!");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Initialize Gemini with System Instructions for better discipline
// Initialize Gemini with System Instructions and Stable Model
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", 
  systemInstruction: `You are the Lead Analyst. Your mission is to research topics deeply and transparently.
  Rules:
  1. Use web_search (MAX 3 TIMES) to gather specific, real-time data. Choose distinct queries.
  2. Use analyze_data once you have sufficient raw research text.
  3. Use write_report ONLY AFTER your analysis is done to create the final brief.
  4. Communicate your thinking clearly at every step.
  5. BE EFFICIENT. If the model seems stuck, proceed to write the final report based on existing data.`,
  tools: [
    {
      functionDeclarations: [
        {
          name: "web_search",
          description: "Performs a deep web search for specific information on a topic.",
          parameters: {
            type: "OBJECT",
            properties: {
              query: { type: "string", description: "The highly specific search string." }
            },
            required: ["query"]
          }
        },
        {
          name: "analyze_data",
          description: "Detailed analysis of raw text to extract key entities and insights.",
          parameters: {
            type: "OBJECT",
            properties: {
              data: { type: "string", description: "Full text content gathered during research." }
            },
            required: ["data"]
          }
        },
        {
          name: "write_report",
          description: "Formats and synthesizes your findings into a final markdown brief.",
          parameters: {
            type: "OBJECT",
            properties: {
              summary: { type: "string", description: "The final structured report in Markdown format." }
            },
            required: ["summary"]
          }
        },
        {
          name: "ask_user",
          description: "Pause execution to ask the user a clarifying question before proceeding.",
          parameters: {
            type: "OBJECT",
            properties: {
              question: { type: "string", description: "The specific question to ask the user." }
            },
            required: ["question"]
          }
        }
      ]
    }
  ],
  toolConfig: { 
    functionCallingConfig: { 
      mode: "AUTO" 
    } 
  }
});

// In-memory Session Store for Interactive Mode
const sessions = new Map();

// Helper to send SSE data
const sendEvent = (res, type, data) => {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
};

// Dynamic Search Mock Helper
const getDynamicSearchResult = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('finance') || q.includes('financial')) {
    return `Results for Financial AI: BloombergGPT (50B parameters) outperforms GPT-4 on finance benchmarks by 12%. 
    FinBERT is the gold standard for sentiment analysis. Other notable models include Finance-LLM from NVIDIA and 
    specialized RAG implementations by J.P. Morgan and Goldman Sachs (2024).`;
  }
  
  if (q.includes('health') || q.includes('medical') || q.includes('doctor')) {
    return `Results for Healthcare AI: Med-PaLM 2 (Google) achieved 86.5% on USMLE-style questions. 
    BioBERT and ClinicalBERT are widely used for clinical entity recognition. IBM Watson Health is 
    undergoing a transition to generative agentic workflows for diagnostic support (2024).`;
  }

  if (q.includes('ai agent') || q.includes('research agent') || q.includes('agentic')) {
    return `Results for AI Agents: CrewAI, AutoGPT, and LangChain Agents are leading the open-source space. 
    Enterprise growth is focused on "Transparent Agents" (Trace Trees). Anthropic Claude 3.1 and 
    Gemini 2.5 Flash show superior function-calling reliability.`;
  }

  return `Results for "${query}": Multiple sources confirm rapid growth in ${query}. 
  Industry leaders are adopting agentic workflows to increase efficiency by 25-40% in 2024. 
  Transparency and real-time tracing are cited as top-3 requirements by 85% of CTOs.`;
};

const tools = {
  web_search: async (args) => {
    console.log(`Tool EXEC: web_search - ${args.query}`);
    // Simplified search mock results to avoid redundant LLM calls
    return getDynamicSearchResult(args.query);
  },
  analyze_data: async (args) => {
    console.log(`Tool EXEC: analyze_data`);
    // Direct content extraction to save quota
    return `Data Analysis Layer 1: Context suggests key trends for "${args.data.substring(0, 50)}...". Analysis complete.`;
  },
  ask_user: async ({ question }) => {
    return `PAUSED: Waiting for user response to: ${question}`;
  },
  write_report: async (args, res, leadId) => {
    console.log(`Tool EXEC: write_report`);
    // Crucial: Emit an artifact immediately so user sees the report even if the chat finishing call fails
    if (res && leadId) {
      sendEvent(res, 'artifact', { 
        id: leadId, 
        name: 'Final Research Brief', 
        type: 'markdown', 
        content: args.summary 
      });
    }
    return `Report written and exported to Library gallery. Summary: ${args.summary.substring(0, 100)}...`;
  }
};

// Orchestration Logic (Real Gemini)
async function orchestrate(res, chat, sessionId, leadId, initialResponse = null) {
  let response = initialResponse;
  let callCount = 0;

  while (callCount < 10) {
    if (!response) break;
    
    const candidates = response.response?.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    if (parts.length === 0) {
      if (candidates[0]?.finishReason === 'SAFETY') {
        sendEvent(res, 'thinking', { id: leadId, text: "⚠️ Content blocked by safety filters." });
      }
      break;
    }

    const textParts = parts.filter(p => p.text).map(p => p.text);
    if (textParts.length > 0) {
      sendEvent(res, 'thinking', { id: leadId, text: textParts.join(' ') });
    }

    const calls = parts.filter(p => p.functionCall);
    if (calls.length === 0) break;

    const toolResponses = [];
    let shouldPause = false;

    for (const call of calls) {
      const toolName = call.functionCall.name;
      const toolId = uuidv4();
      
      sendEvent(res, 'agent_start', { id: toolId, name: toolName, role: 'tool', parentId: leadId });
      sendEvent(res, 'tool_start', { id: toolId, tool: toolName, input: JSON.stringify(call.functionCall.args) });

      if (toolName === 'ask_user') {
        const question = call.functionCall.args.question;
        sendEvent(res, 'ask_user', { id: leadId, question });
        sessions.set(sessionId, { chat, leadId });
        shouldPause = true;
        sendEvent(res, 'tool_end', { id: toolId, tool: toolName, output: `Paused: ${question}` });
        sendEvent(res, 'agent_end', { id: toolId, output: 'Paused' });
        continue;
      }

      sendEvent(res, 'thinking', { id: toolId, text: `🔍 Running tool: ${toolName}...` });
      
      const tool = tools[toolName];
      let output;
      if (toolName === 'write_report') {
        output = await tool(call.functionCall.args, res, leadId);
      } else {
        output = await (tool ? tool(call.functionCall.args) : `Error: Unknown tool ${toolName}`);
      }
      
      const outputPreview = typeof output === 'string' ? `${output.substring(0, 50)}...` : 'Success';
      sendEvent(res, 'thinking', { id: toolId, text: `✅ ${toolName} complete: ${outputPreview}` });
      
      sendEvent(res, 'tool_end', { id: toolId, tool: toolName, output: output });
      sendEvent(res, 'agent_end', { id: toolId, output: output });

      toolResponses.push({
        functionResponse: { name: toolName, response: { result: output } }
      });
    }

    if (shouldPause) {
      sendEvent(res, 'done', { sessionId });
      return res.end();
    }

    try {
      response = await chat.sendMessage(toolResponses);
      callCount++;
    } catch (err) {
      const isQuotaError = err.message.includes('429') || err.message.toLowerCase().includes('quota');
      const errorMsg = isQuotaError ? "⚠️ Quota Exceeded (429): You have used your daily limit for Gemini 2.5 Flash." : `⚠️ API Error: ${err.message}`;
      sendEvent(res, 'thinking', { id: leadId, text: errorMsg });
      if (isQuotaError) {
        sendEvent(res, 'error', { message: errorMsg, type: 'quota' });
      }
      break;
    }
  }

  try {
    const finalMsg = response?.response?.text?.() || "Research cycle complete.";
    sendEvent(res, 'agent_response', { id: leadId, text: finalMsg });
  } catch (e) {
    sendEvent(res, 'agent_response', { id: leadId, text: "Final report generated." });
  }
  sendEvent(res, 'done', { sessionId });
  res.end();
}

app.get('/api/stream', async (req, res) => {
  const { q: query, mock } = req.query;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sessionId = uuidv4();
  const leadId = 'lead-analyst';
  sendEvent(res, 'session_start', { sessionId });

  if (mock === 'true') {
    sendEvent(res, 'agent_start', { id: leadId, name: 'Lead Analyst (Mock)', role: 'orchestrator' });
    await new Promise(r => setTimeout(r, 800));
    sendEvent(res, 'thinking', { id: leadId, text: "Initializing high-fidelity research module..." });
    await new Promise(r => setTimeout(r, 600));
    sendEvent(res, 'thinking', { id: leadId, text: "Scanning global LLM benchmark databases (HELM, OpenCompass)..." });
    await new Promise(r => setTimeout(r, 1000));
    
    // Emit a mock artifact for the new gallery
    sendEvent(res, 'artifact', { 
      id: leadId, 
      name: '2024 LLM Market Analysis', 
      type: 'markdown', 
      content: '# 2024 LLM Market Insights\n\n- **Model Growth**: 250% increase in specialized SLMs (Small Language Models).\n- **Top Performers**: Gemini 1.5 Pro leads in long-context window tasks.\n- **Agent Frameworks**: CrewAI and LangGraph are the top-2 enterprise choices.\n\n*Generated by Deep Analyst Mock Engine.*' 
    });

    sendEvent(res, 'thinking', { id: leadId, text: "Finalizing data synthesis and report generation..." });
    await new Promise(r => setTimeout(r, 1500));
    sendEvent(res, 'agent_response', { id: leadId, text: "Analysis complete. I've generated a detailed artifact in your Results Gallery." });
    sendEvent(res, 'done', { sessionId });
    return res.end();
  }

  sendEvent(res, 'agent_start', { id: leadId, name: 'Lead Analyst (Gemini)', role: 'orchestrator' });
  const chat = model.startChat();
  try {
    const response = await chat.sendMessage(`User query: "${query}"`);
    orchestrate(res, chat, sessionId, leadId, response);
  } catch (err) {
    console.error("STREAM_INIT_ERROR:", err.message);
    sendEvent(res, 'error', { message: err.message });
    res.end();
  }
});

app.post('/api/answer', async (req, res) => {
  const { sessionId, answer } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const session = sessions.get(sessionId);
  if (!session) {
    sendEvent(res, 'error', { message: "Session expired or invalid." });
    return res.end();
  }

  const { chat, leadId } = session;
  sendEvent(res, 'user_answer', { id: leadId, answer });
  sessions.delete(sessionId);

  try {
    // Resume by providing the answer as the OUTPUT of the ask_user tool
    const toolResponses = [{
      functionResponse: {
        name: 'ask_user',
        response: { result: answer }
      }
    }];
    
    const response = await chat.sendMessage(toolResponses);
    orchestrate(res, chat, sessionId, leadId, response);
  } catch (err) {
    console.error("ANSWER_RESUME_ERROR:", err.message);
    sendEvent(res, 'error', { message: `Resume failed: ${err.message}` });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Real Gemini Server running at http://localhost:${PORT}`);
});
