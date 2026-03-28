# Deep Analyst: Research Intelligence Platform

A transparent chat application that renders AI agent execution events—thinking steps, tool calls, sub-agent orchestration—in real-time.

Built as a Capstone Project for **Accelerate Data**.

## 🏗️ Architecture Overview

The system consists of a **Node.js/Express backend** and a **React (Vite) frontend**, using **Server-Sent Events (SSE)** for real-time state synchronization.

- **Backend**: Emits agentic lifecycle events (thinking, tool usage, sub-agent spawning) compatible with the Claude Agent SDK hook system.
- **Frontend**: A custom `useAgentStream` hook decodes the flat event stream and reconstructs a hierarchical "Trace Tree" of agent execution.
- **UI/UX**: Premium dark mode with glassmorphism, featuring live progress indicators and recursive agent node rendering.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. **Clone the repository** (or navigate to the project folder)
2. **Setup the Backend**:
   ```bash
   cd backend
   npm install
   ```
3. **Setup the Frontend**:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend server**:
   ```bash
   cd backend
   npm start
   ```
   The server will run at `http://localhost:3001`.

2. **Start the Frontend dev server**:
   ```bash
   cd frontend
   npm run dev -- --port 3000
   ```
   Open `http://localhost:3000` in your browser.

## 📁 Key Files & Directories

- `/backend/server.js`: The Express server and mock agent event generator.
- `/frontend/src/components/TraceTree.tsx`: Recursive component for rendering the nested agent nodes.
- `/frontend/src/hooks/useAgentStream.ts`: The core logic for decoding SSE events into a reactive agent tree.
- `DESIGN_DOC.md`: 1-pager design document for the project.

## 🧪 Testing

The application includes built-in verification for event decoding and tree construction:
- **Event Decoder**: Verified via real-time stream processing of 10+ distinct event types.
- **UI Verification**: Tested with parallel sub-agent execution and `ask_user` interaction cycles.

---
Developed by **Quy Nguyen**
