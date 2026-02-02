# RTKLIB Web UI

Web UI for RTKLIB command-line tools, providing a modern browser-based interface for GNSS data processing.

## Features

- **Post-Processing**: Process RINEX observation data with `rnx2rtkp`
- **Stream Server**: Real-time GNSS data streaming with `str2str`
- **Data Conversion**: Convert binary data formats with `convbin`

## Quick Start

```bash
docker compose up --build
```

Access the UI at http://localhost:8080

## Development

### Backend
```bash
uv sync
uv run uvicorn rtklib_web_ui.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## License

BSD-2-Clause (same as RTKLIB)
