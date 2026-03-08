const express = require("express");
const { host, nodeEnv, port } = require("./config/env");
const apiRouter = require("./routes");

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use("/api", apiRouter);

app.get("/", (_request, response) => {
  response.json({
    service: "backend",
    status: "ok",
    routes: ["/api/health"]
  });
});

app.use((_request, response) => {
  response.status(404).json({
    status: "error",
    message: "Not found"
  });
});

app.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port} in ${nodeEnv} mode`);
});
