import { Router } from "express";
import {
  userSignup,
  loginUser,
  verifyOTP,
  resendOTP,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,

} from "../controllers/users/users-controller";

const router = Router();

// Auth routes
router.post("/signup", userSignup);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);


// CRUD routes
router.route("/").get(getAllUsers);
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

export { router };
