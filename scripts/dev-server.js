import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8000);
const rootDir = normalize(join(fileURLToPath(new URL("..", import.meta.url))));

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
};

function resolvePath(urlPath) {
  const relativePath = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = normalize(join(rootDir, relativePath));

  if (!safePath.startsWith(rootDir)) {
    return null;
  }

  if (existsSync(safePath) && statSync(safePath).isFile()) {
    return safePath;
  }

  return null;
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
  const filePath = resolvePath(requestUrl.pathname);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const mimeType = MIME_TYPES[extname(filePath)] || "application/octet-stream";
  response.writeHead(200, { "Content-Type": mimeType });
  createReadStream(filePath).pipe(response);
});

server.listen(PORT, () => {
  console.log(`Ant Sim server running at http://localhost:${PORT}`);
});
