# Deep Analyst: Research Intelligence Platform (v2.0)
**Technical Design Document • 1-Pager**

## 1. Executive Summary
Deep Analyst is a high-performance, agentic research workstation designed to transform vague research queries into structured intelligence reports. It features a real-time "Execution Trace" for transparency, an interactive sub-agent flow for human-in-the-loop decision-making, and a persistent artifact library for report management.

## 2. System Architecture

### Frontend (React + Vite + TS)
- **State Orchestration**: Custom `useAgentStream` hook manages Server-Sent Events (SSE), mapping incoming tool-calls and thinking steps to a dynamic `TraceNode` tree.
- **Layout**: A robust 12-column Grid system (Tailwind CSS) enforcing an `overflow-hidden` root with independent internal scrollable panels for Trace, Workspace, and Library.
- **UI Components**:
    - **TraceTree**: Recursive visualization of agent orchestration.
    - **Context Workspace**: Real-time terminal for agent synthesis and human interaction.
    - **Artifact Viewer**: Modal-driven Markdown renderer with perfect text wrapping and download capabilities.

### Backend (Node.js + Express)
- **Agent Logic**: Asynchronous orchestration loop utilizing Gemini 1.5 Flash for rapid tool selection and reasoning.
- **Streaming Engine**: SSE-based event emitter sending granular events (`agent_start`, `thinking`, `tool_end`, `artifact`) to keep the UI in sync with the agent's "brain".
- **Toolbox**: Integration with Web Search and Data Analysis mock/real engines.

## 3. Engineering Key Decisions

### A. Granular Execution Transparency
**Problem**: Traditional AI agents act as a "black box" until the final result.
**Solution**: Implemented tool-specific `thinking` events. Each node in the execution tree displays its own sub-steps (e.g., "🔍 Scanning...", "✅ Data Parsed"), providing 100% visibility into the agent's logic.

### B. Scrolling Layout Stability
**Problem**: Fixed layouts often break when research sessions exceed the viewport.
**Solution**: Adopted a strict Flexbox hierarchy (`h-full min-h-0 overflow-hidden` -> `flex-1 overflow-y-auto`). This prevents the entire page from scrolling and preserves context across all three workstation columns.

### C. Quota & Performance Optimization
**Problem**: High frequency of LLM calls can exhaust API quotas rapidly.
**Solution**: Refactored the orchestration loop to prioritize direct tool outputs for UI feedback, only calling the LLM when context synthesization or a final report is required.

## 4. Key Deliverables
1. **Interactive Agent Loop**: Capability to pause mid-run to ask the user clarifying questions.
2. **Infinite Artifact Gallery**: Automatic categorization and persistent storage of research output.
3. **Execution Tree (Trace)**: High-fidelity visual history of every tool call.

---
*Developed by Nguyen Quy Architecture • March 2026*
