# Deep Analyst: Research Intelligence Platform
**Technical Design Document**

## 1. Executive Summary
Deep Analyst is a high-performance, agentic research workstation designed to transform complex research queries into structured intelligence reports. It features a real-time Execution Trace for transparency, an interactive sub-agent flow for human-in-the-loop decision-making, and a persistent artifact library for report management.

## 2. System Architecture

### Frontend (React + Vite)
- **State Management**: Custom React hooks manage Server-Sent Events (SSE), mapping incoming tool-calls and progress markers to a dynamic execution tree.
- **Layout**: A 12-column grid system enforcing independent internal scrolling for the Trace, Workspace, and Library panels.
- **UI Components**:
    - **TraceTree**: Recursive visualization of agent orchestration.
    - **Context Workspace**: Real-time terminal for agent synthesis and human interaction.
    - **Artifact Viewer**: Modal-driven Markdown renderer with optimized text wrapping and export capabilities.

### Backend (Node.js + Express)
- **Orchestration**: Asynchronous loop utilizing Large Language Models (LLM) for rapid tool selection and reasoning.
- **Streaming Engine**: SSE-based event emitter sending granular events (`agent_start`, `thinking`, `tool_end`, `artifact`) to maintain UI synchronization.
- **Toolbox**: Integration with specialized search and data analysis modules.

## 3. Engineering Decisions

### A. Execution Transparency
**Problem**: Traditional AI agents operate as a "black box," reducing user trust during long-running tasks.
**Solution**: Implemented granular `thinking` events. Each node in the execution tree displays tool-specific sub-steps, providing full visibility into the agent's logic.

### B. Layout Stability & Scroll Management
**Problem**: Fixed layouts often break or cause "double scrolling" when content exceeds the viewport.
**Solution**: Adopted a nested Flexbox architecture with constrained heights. This ensures that only the relevant internal panels scroll, preserving overall workstation context.

### C. Quota Efficiency
**Problem**: Redundant LLM calls can exhaust API limits and increase latency.
**Solution**: Structured the orchestration loop to prioritize direct tool outputs, invoking the LLM only for high-level synthesis and final report generation.

## 4. Key Deliverables
1. **Interactive Agent Loop**: Capability to pause execution for user input.
2. **Artifact Gallery**: Organized repository of generated research outputs.
3. **Execution Trace**: High-fidelity visual history of all agent operations.

---
*Deep Analyst Technical Specification*
