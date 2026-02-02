# Project: RTKLIB-Web-UI (Dockerized)

## Overview
This project aims to create a Web UI for RTKLIB's command-line tools (`consapp`), specifically targeting Linux and MacOS users via Docker. The goal is to provide a User Experience (UX) similar to the Windows GUI version of RTKLIB but accessible through a web browser.

## Architectural Constraints & Tech Stack

### 1. Architecture
- **Deployment:** Docker Container (Single container approach).
- **File Access:** The host's data directory will be bind-mounted to `/workspace` inside the container.
- **Network:** The Web UI and Backend run on the same origin (e.g., `http://localhost:8080`).

### 2. Backend (API & Process Management)
- **Language:** Python 3.11+
- **Framework:** FastAPI
- **Process Handling:** Python `subprocess` (or `asyncio.subprocess`) to spawn RTKLIB binaries (`rnx2rtkp`, `str2str`, `convbin`).
- **Real-time Communication:** `python-socketio` (WebSocket) for streaming process logs and status updates to the frontend.
- **RTKLIB Binaries:** Assume binaries are pre-installed at `/usr/local/bin/` inside the Docker image.

### 3. Frontend (UI)
- **Framework:** React (Vite) + TypeScript.
- **UI Library:** Mantine (Recommended for dense, dashboard-like scientific interfaces) or Chakra UI.
- **State Management:** React Context or Zustand.

## Core Functional Requirements

### 1. UX/UI Design Philosophy
- **Windows-Like Layout:** Mimic the layout of `rtkplot`, `rtkpost`, and `str2str` GUI (RTKNAVI-like dashboard) where appropriate.
- **Default Values:** The UI must load with sensible default settings for RTKLIB, just like the Windows GUI.

### 2. Configuration Management (Crucial)
- **Stateless Container:** Do not rely on saving config files inside the container's system areas.
- **Import/Export Flow:**
  - **Export:** Users configure settings in the Web UI -> Click "Export" -> Browser downloads a `.conf` file (RTKLIB standard format).
  - **Import:** Users upload a `.conf` file -> Web UI parses it and populates the form fields.
  - **Save to Workspace:** Optionally, allow saving the `.conf` file directly to the bind-mounted `/workspace`.

### 3. Feature: Post-Processing (`rnx2rtkp`)
- Form inputs for Observation files (Rover/Base), Nav files, and Output path.
- These paths should refer to files within `/workspace`.
- A file picker component that browses the `/workspace` directory is required.

### 4. Feature: Stream Server (`str2str`)
- **Hybrid Monitoring UI:**
  1.  **Console Output:** A scrollable text area showing the raw `stderr` output from `str2str`.
  2.  **Visual Indicators:** "LED-like" status lights (Green/Red/Blinking) indicating connection status and data traffic, similar to the Windows `strsvr` or `rtknavi`.
- **Implementation Detail:** The Python backend must parse the `str2str` log stream to derive "Heartbeat/Status" events and push them via WebSocket to drive the visual indicators.

## Development Guidelines for AI
1.  **Modularity:** Keep the frontend components (e.g., `ConfigForm`, `LogConsole`, `FileBrowser`) and backend logic (e.g., `RTKProcessManager`, `ConfigParser`) distinct and modular.
2.  **Type Safety:** Use strict TypeScript interfaces for all data exchanged between backend and frontend (especially the Configuration object structure).
3.  **Error Handling:** Ensure that if an RTKLIB process crashes, the Web UI reflects this state immediately.
4.  **Mocking:** If RTKLIB binaries are missing during the dev phase, implement a "Mock Mode" in the backend that simulates log output for UI testing.

## Directory Structure Plan (uv-based)

The project follows the standard `uv` project structure (src layout) for the Python backend, with the frontend residing in a dedicated subdirectory.

```text
rtklib-web-ui/                 # Root (generated via `uv init`)
├── pyproject.toml             # Backend dependencies & metadata
├── uv.lock                    # Lockfile for reproducible builds
├── .python-version
├── README.md
├── src/
│   └── rtklib_web_ui/         # Python Backend Package (snake_case)
│       ├── __init__.py
│       ├── main.py            # FastAPI Entry point
│       ├── api/               # API Routers
│       └── services/          # Business logic (RTKLIB wrapper, etc.)
├── frontend/                  # Frontend (React + Vite)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/                   # React components
├── docker/
│   └── Dockerfile             # Multi-stage build (Node build -> uv sync -> Runtime)
└── docker-compose.yml
```

## Development Notes for AI
- Backend Setup: Use uv sync to install dependencies.
- Docker Build Strategy:
    - Use ghcr.io/astral-sh/uv:python3.11-bookworm (or similar) as the base image, or copy the uv binary into a standard Python image.
    - Run uv sync --frozen --no-dev in the build stage to ensure deterministic builds.
- Naming Convention: The root folder is rtklib-web-ui (kebab-case), but the Python source package inside src/ must be rtklib_web_ui (snake_case) to comply with Python import rules.
