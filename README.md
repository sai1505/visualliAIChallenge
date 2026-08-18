# Visualli — AI Mindmap Generator

Visualli is an AI-powered mindmap generator that converts user-provided text into a structured, interactive mindmap.

The application uses a **React + Vite + Tailwind CSS** frontend and a **FastAPI + Pydantic + SQLite + Groq** backend.

The project is designed around reliable LLM output rather than simply displaying raw model responses. The backend validates structured output, retries invalid generations, separates structure generation from summary generation, persists generated mindmaps, and can stream generation progress to the frontend.

---

## Features

- AI-generated mindmaps from user-provided text
- **Two-phase LLM generation**
  - Phase 1: Generate the mindmap structure
  - Phase 2: Generate summaries for existing nodes
- Structured JSON output from the LLM
- Pydantic schema validation
- Custom business-rule validation
- Corrective retry when LLM output fails parsing or validation
- **Server-Sent Events (SSE)** streaming endpoint
- SQLite persistence
- Saved mindmap history
- Interactive mindmap rendering with React Flow
- Automatic graph layout using Dagre
- Light/dark theme support
- Responsive UI with Tailwind CSS
- Mock generation mode for development and testing
- Backend tests with pytest
- Frontend tests with Vitest + React Testing Library
- LLM calls mocked during automated testing

---

# Architecture

```text
                    ┌──────────────────────────┐
                    │        React Frontend    │
                    │ React + Vite + Tailwind  │
                    │ React Flow + Dagre        │
                    └────────────┬─────────────┘
                                 │
                                 │ HTTP / SSE
                                 ▼
                    ┌──────────────────────────┐
                    │       FastAPI Backend    │
                    │                          │
                    │ Request validation       │
                    │ Streaming endpoint      │
                    │ Persistence             │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │    Generation Pipeline   │
                    │                          │
                    │ Phase 1 → Outline        │
                    │ Phase 2 → Enrichment     │
                    │        ↓                 │
                    │ Combine → Final map      │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       Groq LLM           │
                    └──────────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │         SQLite            │
                    │       mindmaps.db         │
                    └──────────────────────────┘
```

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Flow (`@xyflow/react`)
* Dagre (`@dagrejs/dagre`)
* Vitest
* React Testing Library

## Backend

* Python 3.12
* FastAPI
* Pydantic
* Groq Python SDK
* SQLite
* python-dotenv
* pytest
* uv

---

# Project Structure

```text
visualliAIChallenge/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes.py
│   │   ├── generator.py
│   │   ├── validators.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   │
│   ├── test/
│   │   ├── test_api.py
│   │   ├── test_generator.py
│   │   ├── test_models.py
│   │   └── test_validators.py
│   │
│   ├── .env
│   ├── pyproject.toml
│   ├── uv.lock
│   └── mindmaps.db
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── types/
    │   ├── constants/
    │   ├── api.ts
    │   └── App.tsx
    │
    ├── .env
    ├── package.json
    └── vite.config.ts
```

---

# Prerequisites

Install the following:

* Python 3.12+
* Node.js
* npm
* uv

The backend uses **uv** for Python dependency and virtual-environment management.

## Install uv

If uv is not installed:

```powershell
pip install uv
```

Verify the installation:

```powershell
uv --version
python --version
node --version
npm --version
```

---

# Environment Variables

There are two `.env` files:

```text
backend/.env
frontend/.env
```

---

## Backend Environment

Create:

```text
backend/.env
```

Example:

```env
GROQ_API_KEY=your_groq_api_key
MOCK_MODE=false
```

### `GROQ_API_KEY`

The API key used to communicate with Groq.
Required when real LLM generation is enabled.

### `MOCK_MODE`

Controls whether the backend uses a deterministic mock response.
For development/testing without consuming Groq requests:

```env
MOCK_MODE=true
```

For real LLM generation:

```env
MOCK_MODE=false
```

The application defaults to mock mode when `MOCK_MODE` is not explicitly configured.

> Never commit your actual Groq API key.

---

# Frontend Environment

Create:

```text
frontend/.env
```

```env
VITE_API_URL=http://localhost:8000
```

---

# Backend Setup with uv

From the project root:

```powershell
cd backend
```

Synchronize the Python environment and dependencies:

```powershell
uv sync
```

This creates/synchronizes:

```text
backend/.venv/
```

and installs the dependencies defined in `pyproject.toml`.

---

# Activating the Virtual Environment on Windows

Activate the environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

You should see something similar to:

```text
(.venv) PS C:\...\visualliAIChallenge\backend>
```

---

## PowerShell Execution Policy Error

If PowerShell prevents activation with an execution-policy error, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Then activate:

```powershell
.\.venv\Scripts\Activate.ps1
```

---

# Using uv Without Activating the Environment

Activating `.venv` is optional.

You can directly run commands through uv:

```powershell
uv run pytest
```

This is often convenient because uv automatically uses the project's environment.

---

# Start the Backend

From:

```text
backend/
```

with the virtual environment activated:

```powershell
python run.py
```

The backend will normally run at:

```text
http://localhost:8000
```

FastAPI documentation: (Swagger UI)

```text
http://localhost:8000/docs
```

---

# Start the Frontend

Open a second terminal:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

---

# Complete Application Flow

The complete generation process is:

```text
User enters source text
        │
        ▼
Frontend submits request
        │
        ▼
POST /api/mindmaps/stream
        │
        ▼
Backend validates request
        │
        ▼
Generation starts
        │
        ├────────────── SSE progress events ───────────────┐
        │                                                   │
        ▼                                                   ▼
Phase 1: Outline                                    Frontend progress UI
        │
        ▼
LLM generates:
- title
- root
- nodes
- connections
        │
        ▼
JSON parsing
        │
        ▼
Pydantic validation
        │
        ▼
Business-rule validation
        │
        ├── Invalid
        │      │
        │      ▼
        │   Corrective retry
        │
        ▼
Validated outline
        │
        ▼
Phase 2: Enrichment
        │
        ▼
LLM receives:
- original source
- validated outline
        │
        ▼
Generates summaries
for existing nodes
        │
        ▼
JSON parsing
        │
        ▼
Pydantic validation
        │
        ▼
Business-rule validation
        │
        ├── Invalid
        │      │
        │      ▼
        │   Corrective retry
        │
        ▼
Validated enrichment
        │
        ▼
Combine outline + summaries
        │
        ▼
Final validation
        │
        ▼
Save to SQLite
        │
        ▼
SSE complete event
        │
        ▼
Frontend renders mindmap
```

---

# Two-Phase Generation

Instead of asking the LLM to generate the entire mindmap in one large response, the application separates generation into two phases.

## Phase 1 — Outline Generation

The first LLM call generates the structure:

```json
{
  "title": "Machine Learning",
  "rootId": "root",
  "nodes": [
    {
      "id": "root",
      "label": "Machine Learning"
    },
    {
      "id": "node_1",
      "label": "Data"
    }
  ],
  "connections": [
    {
      "from": "root",
      "to": "node_1",
      "label": "uses"
    }
  ]
}
```

This phase focuses on the graph structure.

The outline is then validated.

Typical structural requirements include:

* 5–9 nodes
* unique node IDs
* `rootId` must be `root`
* connections must reference existing nodes
* no self-connections
* graph must remain connected

---

# Phase 2 — Enrichment

The validated outline is sent to the second LLM call.

The second call generates summaries for the nodes that already exist.

Example:

```json
{
  "summaries": [
    {
      "id": "root",
      "summary": "Machine learning enables systems to learn from data."
    },
    {
      "id": "node_1",
      "summary": "Data provides information used for learning."
    }
  ]
}
```

Phase 2 is intentionally restricted.

It must not:

* create new nodes
* remove nodes
* rename nodes
* modify connections
* introduce unknown node IDs

The final result is created by combining the validated outline with the validated summaries.

---

# Why Two Phases?

Separating structure generation from enrichment provides:

* clearer prompts
* smaller structured responses
* easier validation
* better control over graph structure
* easier error handling
* independent retry behavior
* simpler future expansion

It also prevents the model from simultaneously trying to design the graph and write detailed explanations for every node.

---

# LLM Validation and Retry

LLM output is treated as **untrusted input**.

The validation pipeline is:

```text
Raw LLM Response
       │
       ▼
JSON Parsing
       │
       ▼
Pydantic Validation
       │
       ▼
Application Validation
       │
       ▼
Valid?
```

If generation fails validation, the backend performs a corrective retry.

```text
Attempt 1
   │
   ▼
Invalid output
   │
   ▼
Validation error
   │
   ▼
Corrective prompt
   │
   ▼
Attempt 2
   │
   ├── Valid ──► Continue
   │
   └── Invalid ──► Controlled error
```

This prevents malformed LLM output from being directly displayed to the user.

---

# Validation Responsibilities

## `schemas.py`

Contains API and structured-data schemas.

Examples:

```text
MindmapCreateRequest
MindmapCreateResponse
MindmapSummary
```

Input validation includes requirements such as:

* required input
* non-empty content
* maximum length
* minimum useful text

---

## `models.py`

Contains the Pydantic models used by the generation pipeline.

Examples:

```text
Node
Connection
Mindmap

OutlineNode
OutlineConnection
MindmapOutline

NodeSummary
MindmapEnrichment
```

---

## `validators.py`

Contains application-level/business validation.

Examples:

```text
validate_outline()
validate_enrichment()
validate_mindmap()
```

These validations ensure that the model output is not only valid JSON but also logically valid for the application's requirements.

---

# Streaming Generation

The main generation endpoint uses Server-Sent Events:

```text
POST /api/mindmaps/stream
```

The frontend receives generation progress as the backend moves through each stage.

Example events:

```text
event: phase
data: {"phase":"outline_started","data":{}}
```

```text
event: phase
data: {"phase":"outline_completed","data":{"nodeCount":8}}
```

```text
event: phase
data: {"phase":"enrichment_started","data":{}}
```

```text
event: phase
data: {"phase":"enrichment_completed","data":{}}
```

Finally:

```text
event: complete
data: {...}
```

This allows the frontend to show meaningful progress instead of appearing frozen while waiting for the LLM.

---

# Persistence

Generated mindmaps are stored locally using SQLite.

The database file is:

```text
backend/mindmaps.db
```

SQLite was chosen because:

* no external database server is required
* setup is simple
* it is sufficient for local persistence
* it keeps the project lightweight

---

# Frontend Rendering

The frontend uses:

* **React Flow** for interactive graph rendering
* **Dagre** for automatic graph layout

The backend returns a framework-independent representation:

```text
Nodes
+
Connections
+
Summaries
```

The frontend converts that representation into React Flow nodes and edges.

The rendering pipeline is:

```text
Backend Mindmap
      │
      ▼
React Flow Nodes / Edges
      │
      ▼
Dagre Layout
      │
      ▼
Interactive Mindmap
```

Users can interact with nodes and view their generated summaries.

---

# Mock Mode

Mock mode is especially useful when developing the frontend because it avoids repeatedly consuming Groq API requests.

Set:

```env
MOCK_MODE=true
```

The backend uses deterministic mock generation.

For real AI generation:

```env
MOCK_MODE=false
```

and provide:

```env
GROQ_API_KEY=your_groq_api_key
```
---

# Testing

## Backend Tests

The backend uses pytest.

From:

```text
backend/
```

run:

```powershell
pytest
```

or:

```powershell
uv run pytest
```

The backend tests cover areas including:

* request validation
* API behavior
* generator behavior
* model validation
* outline validation
* enrichment validation
* final mindmap validation
* retry behavior

LLM calls are mocked during automated testing.

Therefore, tests do not require a working Groq API key.

---

# Frontend Tests

The frontend uses:

* Vitest
* React Testing Library

From:

```text
frontend/
```

run:

```powershell
npm run test:run
```

Frontend tests cover application behavior such as:

* initial state
* generation behavior
* request failures
* generated mindmap rendering
* user interaction

Tests should not depend on live LLM calls.