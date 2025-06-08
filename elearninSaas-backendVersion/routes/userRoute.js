const uploads = require("../uploads");
module.exports = (app) => {
  const users = require("../controllers/userController");
  const authMiddleware = require("../middleware/authMiddleware");

  app.post("/register", users.register);
  app.post("/login", users.login);
  app.get("/users", users.findAllusers);
  app.delete("/users/:userId", users.deleteuser);
  // Protected routes
  app.post("/logout", authMiddleware, users.logout);
  app.get("/profile", authMiddleware, users.getProfile);
  app.put("/profile", authMiddleware, uploads.single("image"), users.updateProfile);
    app.post("/forgot-password", users.forgotPassword);
  app.post("/verify-code", users.verifyCode);
  app.post("/reset-password", users.resetPassword);

  // app.get("/users/:userId", users.findOneuser);
 
};