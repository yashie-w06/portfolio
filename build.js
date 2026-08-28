const fs = require("fs");
const path = require("path");

const root = __dirname;
const outDir = path.join(root, "dist");
const serverDir = path.join(outDir, "server");
const files = ["index.html", "style.css", "script.js"];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(serverDir, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(outDir, file));
}

const server = `
const ASSETS = {
  "/": { type: "text/html; charset=utf-8", body: ${JSON.stringify(fs.readFileSync(path.join(root, "index.html"), "utf8"))} },
  "/index.html": { type: "text/html; charset=utf-8", body: ${JSON.stringify(fs.readFileSync(path.join(root, "index.html"), "utf8"))} },
  "/style.css": { type: "text/css; charset=utf-8", body: ${JSON.stringify(fs.readFileSync(path.join(root, "style.css"), "utf8"))} },
  "/script.js": { type: "text/javascript; charset=utf-8", body: ${JSON.stringify(fs.readFileSync(path.join(root, "script.js"), "utf8"))} }
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = ASSETS[url.pathname] || ASSETS["/"];
    return new Response(asset.body, {
      headers: {
        "content-type": asset.type,
        "cache-control": url.pathname === "/" || url.pathname === "/index.html"
          ? "no-cache"
          : "public, max-age=31536000, immutable"
      }
    });
  }
};
`;

fs.writeFileSync(path.join(serverDir, "index.js"), server.trimStart());
