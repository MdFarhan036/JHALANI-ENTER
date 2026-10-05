// Phase 2 keeps authentication integration-friendly.
// Replace this with the existing project's JWT middleware if one already exists.
// For development, x-user-id can be supplied to record created_by.

module.exports = function auth(req, res, next) {
  const rawUserId = req.header("x-user-id");
  req.user = rawUserId ? { id: Number(rawUserId) } : null;
  next();
};
