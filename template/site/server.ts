// __COURSE_TITLE__：本地课程网站 / the course site on this computer.
//
// It serves the course home, the lab and flowchart pages, the project atlas and the episode media on 127.0.0.1.
//
//	npm start                                  # then open the printed link
//	node server.ts --addr 127.0.0.1:9000 --no-open
import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values: flags } = parseArgs({
	options: {
		addr: { type: "string", default: "127.0.0.1:__PORT__" }, // 监听地址（只允许本机）
		content: { type: "string", default: "content" }, // 视频、实验台等课程内容所在的目录
		"no-open": { type: "boolean", default: false }, // 启动后不自动打开浏览器
	},
});

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 19)) {
	console.error(`需要 Node.js 22.19 或更新的版本（当前 ${process.version}）：https://nodejs.org/ / Needs Node.js 22.19 or newer (found ${process.version}): https://nodejs.org/`);
	process.exit(1);
}
const m = /^(127\.0\.0\.1|localhost|\[::1\]):(\d+)$/.exec(flags.addr!);
if (!m) {
	console.error("只能监听本机地址，例如 127.0.0.1:__PORT__ / Listens on this machine only, e.g. 127.0.0.1:__PORT__");
	process.exit(1);
}
const HOST = m[1].replace(/^\[|\]$/g, ""), PORT = Number(m[2]);
const SITE = dirname(fileURLToPath(import.meta.url)), WEB = join(SITE, "web"), CONTENT = resolve(SITE, flags.content!);

// ---------------------------------------------------------------- HTTP

const TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
	".mp4": "video/mp4", ".pdf": "application/pdf", ".vtt": "text/vtt; charset=utf-8", ".ico": "image/x-icon",
};

function send(res: ServerResponse, status: number, body: string, type = "text/plain; charset=utf-8"): void {
	res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
	res.end(body);
}
/** Serve a file under root, with Range support so videos can seek. */
function serveFile(req: IncomingMessage, res: ServerResponse, root: string, rel: string): void {
	const p = resolve(root, "." + decodeURIComponent(rel));
	if (p !== root && !p.startsWith(root + sep)) return send(res, 403, "forbidden");
	let file = p;
	if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
	if (!existsSync(file)) return send(res, 404, "not found");
	const size = statSync(file).size, type = TYPES[extname(file)] ?? "application/octet-stream";
	const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
	if (range) {
		const a = range[1] ? +range[1] : size - +range[2], b = range[1] && range[2] ? +range[2] : size - 1;
		if (a > b || b >= size) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return void res.end(); }
		res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${a}-${b}/${size}`, "Accept-Ranges": "bytes", "Content-Length": b - a + 1 });
		return void createReadStream(file, { start: a, end: b }).pipe(res);
	}
	res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" });
	createReadStream(file).pipe(res);
}

const server = createServer((req, res) => {
	const url = new URL(req.url ?? "/", "http://x");
	if (url.pathname.startsWith("/content/")) return serveFile(req, res, CONTENT, url.pathname.slice("/content".length));
	serveFile(req, res, WEB, url.pathname);
});

server.on("error", (e: NodeJS.ErrnoException) => {
	console.error(e.code === "EADDRINUSE" ? `端口 ${PORT} 被占用了，可以用 --addr 127.0.0.1:<别的端口> 换一个。 / Port ${PORT} is in use; pick another with --addr 127.0.0.1:<port>.` : e.message);
	process.exit(1);
});
server.listen(PORT, HOST, () => {
	const link = `http://${flags.addr}/`;
	console.log(`\n  __COURSE_TITLE__ 已启动 / started\n\n  课程首页 / Home:  ${link}\n\n  按 Ctrl+C 退出。 / Press Ctrl+C to stop.\n`);
	if (!flags["no-open"]) {
		const [cmd, ...args] = process.platform === "darwin" ? ["open", link] : process.platform === "win32" ? ["cmd", "/c", "start", "", link] : ["xdg-open", link];
		spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
	}
});
