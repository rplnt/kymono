import argparse
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response

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

# Proxy configuration (set at startup)
PROXY_MODE = False
PROXY_HOST = ""
PROXY_PHPSESSID = ""


def configure_proxy(host: str, phpsessid: str) -> None:
    """Configure proxy mode settings."""
    global PROXY_MODE, PROXY_HOST, PROXY_PHPSESSID
    PROXY_MODE = True
    PROXY_HOST = host.rstrip("/")
    PROXY_PHPSESSID = phpsessid


async def proxy_post(path: str, body: bytes, content_type: str) -> Response:
    """Forward POST request to the proxy target."""
    url = f"{PROXY_HOST}{path}"
    cookies = {"PHPSESSID": PROXY_PHPSESSID}
    headers = {"content-type": content_type}

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url, content=body, headers=headers, cookies=cookies, follow_redirects=True
        )
        print(f"PROXY POST: {path} -> {response.status_code} ({len(response.content)} bytes)")
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers={"content-type": response.headers.get("content-type", "text/html")},
        )


async def proxy_request(path: str) -> Response:
    """Forward request to the proxy target."""
    url = f"{PROXY_HOST}{path}"
    cookies = {"PHPSESSID": PROXY_PHPSESSID}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, cookies=cookies, follow_redirects=True)
        print(f"PROXY: {path} -> {response.status_code} ({len(response.content)} bytes)")
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers={"content-type": response.headers.get("content-type", "text/html")},
        )


@app.get("/id/8099985/{template_id}")
async def get_base_template(template_id: str, request: Request) -> Response:
    """Serve HTML for base path (bookmarks, MPN)."""
    if PROXY_MODE:
        return await proxy_request(f"/id/8099985/{template_id}")

    file_path = HTML_DIR / "base" / f"{template_id}.html"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Template {template_id} not found")

    return HTMLResponse(content=file_path.read_text(encoding="utf-8"))


@app.get("/id/{node_id}/{template_id}")
async def get_node_template(node_id: str, template_id: str, request: Request) -> Response:
    """Serve HTML for node with specific template."""
    if PROXY_MODE:
        return await proxy_request(f"/id/{node_id}/{template_id}")

    file_path = HTML_DIR / "nodes" / node_id / f"{template_id}.html"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Node {node_id} template {template_id} not found")

    return HTMLResponse(content=file_path.read_text(encoding="utf-8"))


@app.post("/id/{node_id}/{template_id}")
async def post_node_with_template(node_id: str, template_id: str, request: Request) -> Response:
    """Handle POST to node with template ID."""
    if PROXY_MODE:
        body = await request.body()
        content_type = request.headers.get("content-type", "")
        return await proxy_post(f"/id/{node_id}/{template_id}", body, content_type)

    print(f"MOCK POST: /id/{node_id}/{template_id}")
    return JSONResponse({"status": "ok"})


@app.post("/id/{node_id}")
async def post_node(node_id: str, request: Request) -> Response:
    """Handle POST to node (comment submission)."""
    if PROXY_MODE:
        body = await request.body()
        content_type = request.headers.get("content-type", "")
        return await proxy_post(f"/id/{node_id}", body, content_type)

    print(f"MOCK POST: /id/{node_id}")
    return JSONResponse({"status": "ok"})


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "mode": "proxy" if PROXY_MODE else "mock",
        "proxy_host": PROXY_HOST if PROXY_MODE else None,
        "html_dir": str(HTML_DIR) if not PROXY_MODE else None,
    }


if __name__ == "__main__":
    import uvicorn

    parser = argparse.ArgumentParser(description="Mock/Proxy server for kymono app")
    parser.add_argument(
        "--proxy",
        action="store_true",
        help="Enable proxy mode (forward requests to real server)",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="https://kyberia.sk",
        help="Target host for proxy mode (default: https://kyberia.sk)",
    )
    parser.add_argument(
        "--phpsessid",
        type=str,
        default="",
        help="PHPSESSID cookie value for authentication",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8099,
        help="Port to run the server on (default: 8099)",
    )

    args = parser.parse_args()

    if args.proxy:
        if not args.phpsessid:
            parser.error("--phpsessid is required when using --proxy mode")
        configure_proxy(args.host, args.phpsessid)
        print(f"Running in PROXY mode -> {args.host}")
    else:
        print(f"Running in MOCK mode (serving from {HTML_DIR})")

    uvicorn.run(app, host="0.0.0.0", port=args.port)
