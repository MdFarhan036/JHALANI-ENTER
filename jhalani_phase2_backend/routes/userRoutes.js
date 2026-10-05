const express = require("express");

const {
  login,
  logout,
  checkAuth,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* Public */
router.post("/login", login);

/* Authenticated */
router.post("/logout", authenticate, logout);

router.get("/check-auth", authenticate, checkAuth);

/* User management */
router.get(
  "/",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  getUsers
);

router.post(
  "/",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  createUser
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  updateUser
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN"
  ),
  deleteUser
);

module.exports = router;