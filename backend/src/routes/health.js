const { Router } = require("express");

const router = Router();

router.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
