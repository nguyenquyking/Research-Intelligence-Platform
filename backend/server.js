const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Helper to send SSE data
const sendEvent = (res, type, data) => {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
};

app.get('/api/stream', (req, res) => {
  const query = req.query.q;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  console.log(`Starting stream for query: ${query}`);

  // Mock Agent Execution
  const runAgent = async () => {
    const sessionId = uuidv4();
    
    // 1. Session Start
    sendEvent(res, 'session_start', { sessionId });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Lead Analyst Starts Thinking
    const leadId = 'lead-analyst';
    sendEvent(res, 'agent_start', { id: leadId, name: 'Lead Analyst', role: 'orchestrator' });
    sendEvent(res, 'thinking', { id: leadId, text: 'Decomposing the research request into subtopics...' });
    await new Promise(r => setTimeout(r, 2000));

    // 3. Ask User (Simulated)
    sendEvent(res, 'ask_user', { 
      id: leadId, 
      question: 'Which angle matters most: technical capabilities, developer adoption, or enterprise readiness?' 
    });
    
    // In a real app, we'd wait for a POST to /api/answer. 
    // Here we'll simulate a 3s pause then auto-continue with a mock answer.
    await new Promise(r => setTimeout(r, 4000));
    sendEvent(res, 'user_answer', { id: leadId, answer: 'technical capabilities and developer adoption' });
    
    sendEvent(res, 'thinking', { id: leadId, text: 'Understood. Spawning parallel researchers...' });
    await new Promise(r => setTimeout(r, 1500));

    // 4. Parallel Researchers
    const r1Id = 'researcher-1';
    const r2Id = 'researcher-2';

    // Start both
    sendEvent(res, 'agent_start', { id: r1Id, name: 'Web Researcher (SDKs)', parentId: leadId });
    sendEvent(res, 'agent_start', { id: r2Id, name: 'Web Researcher (Market)', parentId: leadId });

    // Concurrent thinking
    sendEvent(res, 'thinking', { id: r1Id, text: 'Searching for Anthropic SDK documentation and GitHub trends...' });
    sendEvent(res, 'thinking', { id: r2Id, text: 'Analyzing market share and VC funding data...' });
    await new Promise(r => setTimeout(r, 2000));

    // Tool use
    sendEvent(res, 'tool_start', { id: r1Id, tool: 'WebSearch', input: 'claude agent sdk github stars' });
    await new Promise(r => setTimeout(r, 1000));
    sendEvent(res, 'tool_end', { id: r1Id, tool: 'WebSearch', output: 'Found 15k+ stars and 200+ forks across ecosystem.' });

    sendEvent(res, 'tool_start', { id: r2Id, tool: 'WebSearch', input: 'AI agent framework market size 2024' });
    await new Promise(r => setTimeout(r, 1500));
    sendEvent(res, 'tool_end', { id: r2Id, tool: 'WebSearch', output: 'Market projected to grow 45% CAGR.' });

    // Researchers finish
    sendEvent(res, 'agent_end', { id: r1Id, output: 'SDK adoption is growing rapidly among early adopters.' });
    sendEvent(res, 'agent_end', { id: r2Id, output: 'Enterprise interest is high but production deployments are still scaling.' });
    await new Promise(r => setTimeout(r, 1000));

    // 5. Data Analyst
    const daId = 'data-analyst';
    sendEvent(res, 'agent_start', { id: daId, name: 'Data Analyst', parentId: leadId });
    sendEvent(res, 'thinking', { id: daId, text: 'Extracting metrics from research notes...' });
    await new Promise(r => setTimeout(r, 2000));
    sendEvent(res, 'tool_start', { id: daId, tool: 'Bash', input: 'python3 generate_chart.py' });
    await new Promise(r => setTimeout(r, 1000));
    sendEvent(res, 'artifact', { id: daId, name: 'adoption_chart.png', type: 'image', content: 'Charts generated' });
    sendEvent(res, 'tool_end', { id: daId, tool: 'Bash', output: 'Chart saved to artifacts.' });
    sendEvent(res, 'agent_end', { id: daId, output: 'Extracted 5 key metrics.' });

    // 6. Final Report
    const rwId = 'report-writer';
    sendEvent(res, 'agent_start', { id: rwId, name: 'Report Writer', parentId: leadId });
    sendEvent(res, 'thinking', { id: rwId, text: 'Synthesizing final brief...' });
    await new Promise(r => setTimeout(r, 2000));
    sendEvent(res, 'artifact', { id: rwId, name: 'research_brief.md', type: 'markdown', content: '# Final Research Brief\n\n...' });
    sendEvent(res, 'agent_end', { id: rwId, output: 'Report finished.' });

    // 7. Lead Response
    sendEvent(res, 'agent_response', { id: leadId, text: 'The research is complete. I found that Anthropic has a strong technical edge but faces stiff competition in developer mindshare.' });
    sendEvent(res, 'done', { sessionId });
    
    console.log('Stream finished.');
    res.end();
  };

  runAgent().catch(err => {
    console.error(err);
    sendEvent(res, 'error', { message: err.message });
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
