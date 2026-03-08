const { Router } = require("express");
const healthRouter = require("./health");

const router = Router();

router.use(healthRouter);

module.exports = router;
