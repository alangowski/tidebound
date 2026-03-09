const { verifyJwt } = require("../services/token");

function requireAuth(request, response, next) {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return response.status(401).json({
      status: "error",
      message: "Missing or invalid authorization header"
    });
  }

  try {
    const token = header.slice(7);
    request.user = verifyJwt(token);
    next();
  } catch {
    return response.status(401).json({
      status: "error",
      message: "Invalid or expired token"
    });
  }
}

module.exports = { requireAuth };
