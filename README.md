# Deep Analyst: Research Intelligence Platform

A transparent chat application that renders AI agent execution events—thinking steps, tool calls, sub-agent orchestration—in real-time. 

This version is powered by **Gemini 2.5 Flash**, demonstrating cross-model agentic interoperability by mapping Gemini's reasoning to a high-transparency Trace Tree.

## 🏗️ Architecture Overview

The system consists of a **Node.js/Express backend** and a **React (Vite) frontend**, using **Server-Sent Events (SSE)** for real-time state synchronization.

- **Backend**: Integrates Google's Gemini-2.5-Flash model. It captures Gemini's "thoughts" and "function calls" and re-emits them as a structured event stream.
- **Frontend**: A custom `useAgentStream` hook decodes the event stream and reconstructs a hierarchical "Trace Tree" of agent execution.
- **UI/UX**: Premium dark mode with glassmorphism, featuring live progress indicators and recursive agent node rendering.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- **Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))

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

### Configuration

Create a `backend/.env` file with the following:
```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
PORT=3001
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

- `/backend/server.js`: The real-time agent engine using Gemini SDK.
- `/frontend/src/components/TraceTree.tsx`: Recursive component for rendering the nested agent nodes.
- `/frontend/src/hooks/useAgentStream.ts`: Logic for decoding SSE events into a reactive agent tree.
- `DESIGN_DOC.md`: 1-pager design document for the project.

---
Developed for **Accelerate Data Capstone Project** by **Quy Nguyen**.
