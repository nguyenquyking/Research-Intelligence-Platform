# Design Document: Deep Analyst Research Platform

**Title:** Real-time Transparent Agentic Reasoning System
**Author:** Quy Nguyen
**Date:** 2026-03-28

## Tenets
- **Transparency First**: Every thought, tool call, and sub-agent spawn must be visible in real-time.
- **Hierarchical Clarity**: Nested agent relationships must be rendered as a clear parent-child tree.
- **Model Agnostic Backend**: The backend is architected to support both Claude (via SDK) and Gemini (via direct bridge), while maintaining a unified event schema.

## Problem
AI agents are often "black boxes." When an orchestrator spawns multiple sub-agents, the user sees a single loading spinner or a flat text response. This makes it impossible to debug, audit, or trust the agent's complex reasoning and parallel work.

## Proposed Solution
A full-stack application that decodes agentic event streams into a reactive, hierarchical UI. We use a recursive "Trace Tree" component that grows dynamically as events arrive, clearly separating the Lead Analyst from its specialist researchers. 

The current implementation is powered by **Gemini 2.5 Flash**, mapping its function-calling events into the visual "Claude Trace Tree" interaction patterns.

## Goals
- Handle flat SSE event streams and reconstruct a nested agent DAG.
- Support parallel sub-agent execution visualization.
- Implement the `ask_user` interaction pattern without breaking the stream.
- Collect and display artifacts (research notes, charts) produced by sub-agents.

## Non-goals
- Building the LLM models (we consume the SDK).
- Long-term persistent database (sessions are handled in-memory for the demo).

## Implementation Details

### Single vs. Multiple Messages
The system supports sequential messages in the chat panel, each triggering a fresh trace run in the Trace Tree.

### Parallel Agent Appearance
Sub-agents with the same `parentId` are rendered as siblings under the parent node, each with its own status indicator and progress line.

### ask_user Flow
When a `pause` event arrives, the specific agent node highlights in yellow. The user provides input via the chat, which is then sent back to the server to resume the stream.

### Artifact Surfacing
Tool outputs that generate files are tagged as "artifacts" and pinned to the specific agent node that created them, allowing the user to view the intermediate work.

## Open Questions
- **Persistence**: Should we store the full trace for all historical sessions? (Currently: Local state only).
- **Control**: Should the user be able to "kill" a specific sub-agent node manually? (Currently: Automatic lifecycle).
