const express = require("express");
const {
  register,
  login,
  followUser,
  logout,
  updatePassword,
  updateProfile,
  deleteMyProfile,
  myProfile,
  getUserProfile,
  getAllUsers,
  forgotPassword,
  resetPassword,
} = require("../controllers/user");
const { isAuthenticated } = require("../middlewares/auth");
const router = express.Router();

// route for ragistering user
router.route("/register").post(register);

// route for login user
router.route("/login").post(login);

// route for logout
router.route("/logout").get(isAuthenticated, logout);

//route for following user
router.route("/follow/:id").get(isAuthenticated, followUser);

// route for updating password
router.route("/update/password").put(isAuthenticated, updatePassword);

// route for updating profile
router.route("/update/profile").put(isAuthenticated, updateProfile);

//route for deleting profile
router.route("/delete/me").delete(isAuthenticated, deleteMyProfile);

//route for getting My posts
router.route("/me").get(isAuthenticated, myProfile);

//route for searching user
router.route("/user/:id").get(isAuthenticated, getUserProfile);

// route for getting all users
router.route("/users").get(isAuthenticated, getAllUsers);

//route for fogot password
router.route("/forgot/password").post(forgotPassword);

//route for updating password
router.route("/password/reset/:token").put(resetPassword);

module.exports = router;
