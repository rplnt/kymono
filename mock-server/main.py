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


@app.get("/id/8099985/{template_id}")
async def get_base_template(template_id: str) -> HTMLResponse:
    """Serve HTML for base path (bookmarks, MPN)."""
    file_path = HTML_DIR / "base" / f"{template_id}.html"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Template {template_id} not found")

    return HTMLResponse(content=file_path.read_text(encoding="utf-8"))


@app.get("/id/{node_id}/{template_id}")
async def get_node_template(node_id: str, template_id: str) -> HTMLResponse:
    """Serve HTML for node with specific template."""
    file_path = HTML_DIR / "nodes" / node_id / f"{template_id}.html"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Node {node_id} template {template_id} not found")

    return HTMLResponse(content=file_path.read_text(encoding="utf-8"))


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "html_dir": str(HTML_DIR)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8099)
