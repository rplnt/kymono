from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory containing HTML files
HTML_DIR = Path(__file__).parent / "html"


@app.get("/id/8099985/{node_id}")
async def get_node(node_id: str) -> HTMLResponse:
    """Serve HTML file for a given node ID."""
    file_path = HTML_DIR / f"{node_id}.html"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")

    content = file_path.read_text(encoding="utf-8")
    return HTMLResponse(content=content)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "html_dir": str(HTML_DIR)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8099)
