const express = require("express");
const cors = require("cors");
const { host, nodeEnv, port } = require("./config/env");
const { initializeDatabase } = require("./db/init");
const apiRouter = require("./routes");

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

app.get("/", (_request, response) => {
  response.json({
    service: "backend",
    status: "ok",
    routes: ["/api/health", "/api/auth/request-magic-link", "/api/auth/verify"]
  });
});

app.use((_request, response) => {
  response.status(404).json({
    status: "error",
    message: "Not found"
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    status: "error",
    message: "Internal server error"
  });
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(port, host, () => {
      console.log(`Backend listening on http://${host}:${port} in ${nodeEnv} mode`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
