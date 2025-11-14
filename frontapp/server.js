import fs from "fs";
import https from "https";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(
    "C:/Users/User/OneDrive/바탕 화면/fullstack/guardian/Teamprj-Guardian-/certs/localhost-key.pem"
  ),
  cert: fs.readFileSync(
    "C:/Users/User/OneDrive/바탕 화면/fullstack/guardian/Teamprj-Guardian-/certs/localhost.pem"
  ),
};

app.prepare().then(() => {
  https
    .createServer(httpsOptions, (req, res) => handle(req, res))
    .listen(3000, (err) => {
      if (err) throw err;
      console.log("> Ready on https://localhost:3000");
    });
});
