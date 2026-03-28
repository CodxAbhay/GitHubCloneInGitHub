function authorizeUserSelf(req, res, next) {
  // Requires authMiddleware to have already run and set req.user
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const targetUserId = req.params.id;

  if (!targetUserId || targetUserId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: you can only modify your own profile",
    });
  }

  next();
}

module.exports = {
  authorizeUserSelf,
};

