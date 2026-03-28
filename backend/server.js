const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  tools: [
    {
      functionDeclarations: [
        {
          name: "web_search",
          description: "Search the web for real-time information on a research subtopic.",
          parameters: {
            type: "OBJECT",
            properties: {
              query: { type: "string", description: "The specific search query." }
            },
            required: ["query"]
          }
        },
        {
          name: "analyze_data",
          description: "Extract metrics and generate insights from research findings.",
          parameters: {
            type: "OBJECT",
            properties: {
              data: { type: "string", description: "The raw research text to examine." }
            },
            required: ["data"]
          }
        },
        {
          name: "write_report",
          description: "Synthesize all findings into a final markdown research brief.",
          parameters: {
            type: "OBJECT",
            properties: {
              summary: { type: "string", description: "The structured summary of all research." }
            },
            required: ["summary"]
          }
        }
      ]
    }
  ]
});

// Helper to send SSE data
const sendEvent = (res, type, data) => {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
};

// Simulated Tool Logic
const tools = {
  web_search: async (args) => {
    console.log(`Tool EXEC: web_search - ${args.query}`);
    // Simulated high-quality results based on query
    return `Results for "${args.query}": Multiple sources confirm rapid growth in AI agents. Anthropic SDK is praised for its safety-first approach and robust hook system. Github shows 15k+ stars.`;
  },
  analyze_data: async (args) => {
    console.log(`Tool EXEC: analyze_data`);
    return `Data Analysis: Key metrics extracted: 75% developer satisfaction, 45% CAGR growth, 12 major cloud partnerships.`;
  },
  write_report: async (args) => {
    console.log(`Tool EXEC: write_report`);
    return `Final Brief: Anthropic holds a dominant position in Enterprise Agent SDKs due to its transparency features. Recommendation: Focus on ecosystem integrations.`;
  }
};

app.get('/api/stream', (req, res) => {
  const query = req.query.q;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sessionId = uuidv4();
  const leadId = 'lead-analyst';

  const runAgent = async () => {
    sendEvent(res, 'session_start', { sessionId });
    sendEvent(res, 'agent_start', { id: leadId, name: 'Lead Analyst (Gemini)', role: 'orchestrator' });
    
    let chat = model.startChat();
    let prompt = `User query: "${query}". 
    You are the Lead Analyst. Your mission is to research this topic deeply. 
    1. Use web_search (MAX 3 TIMES) to get data. Choose your queries wisely to cover the most important aspects.
    2. Use analyze_data to process findings.
    3. Use write_report to finish.
    4. Communicate your thinking clearly at every step.
    
    IMPORTANT: If the query is ambiguous, call 'ask_user' (simulated by sending a thinking block starting with [ASK_USER]).`;

    let response = await chat.sendMessage(prompt);
    
    // Process the conversation loop
    let callCount = 0;
    let webSearchCount = 0;
    while (callCount < 10) { // Safety limit
      const parts = response.response.candidates[0].content.parts;
      
      // Handle Thoughts
      const textParts = parts.filter(p => p.text).map(p => p.text).join('\n');
      if (textParts) {
        sendEvent(res, 'thinking', { id: leadId, text: textParts });
      }

      // Handle Function Calls
      const calls = parts.filter(p => p.functionCall);
      if (calls.length === 0) break;

      const toolResponses = [];
      for (const call of calls) {
        const toolId = `sub-${uuidv4().slice(0, 4)}`;
        const toolName = call.functionCall.name;
        
        // Enforce web_search limit
        if (toolName === 'web_search') {
          if (webSearchCount >= 3) {
            toolResponses.push({
              functionResponse: {
                name: toolName,
                response: { result: "Error: Web search limit reached (3/3). Please proceed with the information you already have." }
              }
            });
            continue;
          }
          webSearchCount++;
        }

        // Emit events for the UI
        sendEvent(res, 'agent_start', { id: toolId, name: `Agent: ${toolName}`, parentId: leadId });
        sendEvent(res, 'tool_start', { id: toolId, tool: toolName, input: JSON.stringify(call.functionCall.args) });
        
        // Execute real tool logic
        const result = await (tools[toolName] ? tools[toolName](call.functionCall.args) : "Unknown tool");
        
        sendEvent(res, 'tool_end', { id: toolId, tool: toolName, output: result });
        sendEvent(res, 'agent_end', { id: toolId, output: result });

        toolResponses.push({
          functionResponse: {
            name: toolName,
            response: { result }
          }
        });
      }

      // Send results back to Gemini to continue reasoning
      response = await chat.sendMessage(toolResponses);
      callCount++;
    }

    sendEvent(res, 'agent_response', { id: leadId, text: response.response.text() });
    sendEvent(res, 'done', { sessionId });
    res.end();
  };

  runAgent().catch(err => {
    console.error(err);
    sendEvent(res, 'error', { message: err.message });
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`Real Gemini Server running at http://localhost:${PORT}`);
});
