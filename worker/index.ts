import http from "node:http";

const PORT = Number(process.env.PORT || 4000);
const leakChunks: Buffer[] = [];

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET" && url === "/healthz") {
    const memMB = Math.round(process.memoryUsage().rss / (1024 * 1024));
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok", memoryMB: memMB, leakedChunks: leakChunks.length }));
    return;
  }

  if (req.method === "POST" && url === "/dispatch") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const parsed = JSON.parse(body || "{}");
      const mode = parsed.mode || "full_tts";
      const recipientsCount = Number(parsed.recipientsCount || 10);

      // Simulate heavy TTS memory spike when unthrottled under 400-guest storm
      if (mode === "full_tts" && recipientsCount >= 200) {
        for (let i = 0; i < 6; i++) {
          leakChunks.push(Buffer.alloc(32 * 1024 * 1024, 1)); // ~192MB -> triggers 128Mi K8s OOMKill
        }
      }

      res.writeHead(200);
      res.end(
        JSON.stringify({
          dispatched: true,
          mode,
          recipientsCount,
          memoryMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        })
      );
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`MandapSLA voice-dispatch-worker listening on :${PORT}`);
});
