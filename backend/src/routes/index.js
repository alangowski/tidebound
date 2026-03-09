const { Router } = require("express");
const healthRouter = require("./health");
const authRouter = require("./auth");

const router = Router();

router.use(healthRouter);
router.use(authRouter);

module.exports = router;
