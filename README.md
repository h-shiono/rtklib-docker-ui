# RTKLIB Web UI

A modern web-based user interface for [RTKLIB](https://github.com/tomojitakasu/RTKLIB) command-line tools, designed to provide Linux and macOS users with a GUI experience similar to the Windows version of RTKLIB, accessible through any web browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)
![RTKLIB](https://img.shields.io/badge/RTKLIB-2.4.3%20b34-green.svg)

## ✨ Features

### 🛰️ GNSS Post-Processing (rnx2rtkp)
- **Comprehensive Configuration UI**: 7-tabbed interface covering all rnx2rtkp parameters
  - Setting 1: Positioning modes (Single, DGPS, Kinematic, Static, Moving-Base, Fixed, PPP)
  - Setting 2: Ambiguity resolution strategies (GPS, GLONASS, BeiDou AR modes)
  - Output: Solution format, time format, datum settings
  - Stats: Error models and process noise configuration
  - Positions: Rover and base station configuration
  - Files: Auxiliary file management (ANTEX, Geoid, DCB, EOP, BLQ, IONEX)
  - Misc: Time system, corrections, RINEX options

- **Intelligent Conditional Logic**: UI fields automatically enable/disable based on positioning mode and output format, mimicking the Windows RTKLIB GUI behavior

- **SNR Mask Editor**: Visual 3×9 matrix editor for elevation-dependent SNR masks (L1/L2/L5 frequencies)

- **Configuration Persistence**: Auto-save to browser localStorage with versioning

### 📡 Real-Time Stream Server (str2str)
- **Stream Configuration**: Input/output stream setup with TCP, UDP, serial, and file support
- **Visual Monitoring**: LED-like status indicators showing connection and data traffic
- **Console Output**: Real-time log streaming via WebSocket
- **Process Management**: Start, stop, and monitor stream server processes

### 🎯 User Experience
- **Windows-Like Interface**: Familiar layout for users transitioning from RTKLIB Windows GUI
- **Responsive Design**: Dense, dashboard-like scientific interface using Mantine UI
- **File Browser**: Browse mounted workspace directory for RINEX and navigation files
- **Configuration Import/Export**: Load and save RTKLIB `.conf` files (planned)

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- GNSS data files (RINEX observation and navigation files)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rtklib-web-ui.git
   cd rtklib-web-ui
   ```

2. **Prepare your workspace**
   ```bash
   mkdir -p ./workspace
   # Copy your RINEX files to ./workspace
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker compose up --build
   ```

4. **Access the Web UI**

   Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Development Setup

#### Backend (Python)

```bash
# Install dependencies using uv
uv sync

# Run development server
uv run uvicorn rtklib_web_ui.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies API requests to the backend.

## 🛠 Architecture

### Technology Stack

#### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Process Management**: asyncio.subprocess for spawning RTKLIB binaries
- **Real-time Communication**: WebSocket for log streaming
- **Data Validation**: Pydantic models

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Mantine v7
- **State Management**: React hooks with localStorage persistence
- **Styling**: Compact, dense layout optimized for scientific applications

#### Deployment
- **Container**: Single Docker container with multi-stage build
- **RTKLIB Binaries**: Pre-installed at `/usr/local/bin/` (str2str, rnx2rtkp, convbin, rtkrcv)
- **Workspace**: Host directory bind-mounted to `/workspace` inside container

### Project Structure

```
rtklib-web-ui/
├── src/
│   └── rtklib_web_ui/          # Python backend package
│       ├── main.py             # FastAPI entry point
│       ├── api/                # API routers
│       └── services/           # Business logic (RTKLIB wrappers)
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── types/              # TypeScript type definitions
│   │   └── api/                # API client functions
│   └── package.json
├── docker/
│   └── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml
├── pyproject.toml              # Backend dependencies (uv)
└── README.md
```

### Key Design Decisions

1. **Stateless Container**: Configuration files are not saved inside the container. Users export/import `.conf` files or save to the mounted workspace.

2. **Conditional UI Logic**: Helper boolean pattern for clean, maintainable conditional enable/disable logic based on positioning modes.

3. **Type Safety**: Strict TypeScript interfaces mirror Pydantic models, with automatic camelCase ↔ snake_case conversion.

4. **LocalStorage Versioning**: Configuration persistence uses versioned keys (e.g., `v12`) to prevent schema conflicts during updates.

## 🧪 Testing

```bash
# Backend tests
uv run pytest

# Frontend tests
cd frontend
npm run test

# End-to-end tests
npm run test:e2e
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. **Code Style**
   - Python: Follow PEP 8, use type hints
   - TypeScript: Use strict mode, prefer functional components
   - Keep components modular and focused

2. **Naming Conventions**
   - Frontend: camelCase for variables, PascalCase for components
   - Backend: snake_case for variables and functions
   - Conversion happens automatically via Pydantic

3. **Commit Messages**
   - Use conventional commits format: `feat:`, `fix:`, `docs:`, etc.
   - Be descriptive and reference issues when applicable

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 RTKLIB Web UI Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Note**: RTKLIB itself is distributed under the BSD 2-clause license. This project provides only a web interface wrapper and does not modify RTKLIB source code.

## 🙏 Acknowledgements

### RTKLIB
This project is built upon [RTKLIB](https://github.com/tomojitakasu/RTKLIB) by Tomoji Takasu, an open-source GNSS positioning software package. We are grateful for the incredible work of the RTKLIB community.

### LLM Utilization
This project was developed with significant assistance from Large Language Models:
- **Claude** (Anthropic): Architecture design, code generation, and implementation guidance
- **Gemini** (Google): Code review, optimization suggestions, and documentation

The use of AI assistants enabled rapid prototyping and comprehensive coverage of RTKLIB's extensive configuration options while maintaining code quality and type safety.

### Open Source Libraries
Special thanks to the following open-source projects:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI component library
- [Mantine](https://mantine.dev/) - React components library
- [Vite](https://vitejs.dev/) - Next-generation frontend tooling
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer

### Community
Thanks to all contributors who have helped improve this project through bug reports, feature requests, and code contributions.

---

**Disclaimer**: This is an independent project and is not officially affiliated with or endorsed by the RTKLIB project. For official RTKLIB information, please visit the [official RTKLIB repository](https://github.com/tomojitakasu/RTKLIB).
