import fs from "fs";
import https from "https";
import next from "next";
import path from "path";
import { fileURLToPath } from "url";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = next({ dev, port });
const handle = app.getRequestHandler();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certsDir = path.resolve(__dirname, "../certs");

const httpsOptions = {
  key: fs.readFileSync(path.join(certsDir, "localhost-key.pem")),
  cert: fs.readFileSync(path.join(certsDir, "localhost.pem")),
};

app.prepare().then(() => {
  https
    .createServer(httpsOptions, (req, res) => handle(req, res))
    .listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on https://localhost:${port}`);
    });
});
