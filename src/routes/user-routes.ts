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
import { createUserProduct, deleteUserProduct, getAllUserProducts, getUserProductById, getUserProductsByUserId, updateUserProduct } from "../controllers/user-products/user-products-controller";
import { authMiddleware } from "../middleware/check-auth";

const router = Router();

// Auth routes
router.post("/signup", userSignup);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);


// CRUD routes
router.route("/").get(getAllUsers);
router.route("/:id").get(authMiddleware,getUserById).put(authMiddleware,updateUser).delete(authMiddleware,deleteUser);

//User-product routes
router.post("/user-products", authMiddleware, createUserProduct);
router.get("/my-products/:userId", authMiddleware, getUserProductsByUserId);
router.route("/user-products/:id")
  .get(authMiddleware, getUserProductById)
  .put(authMiddleware, updateUserProduct)
  .delete(authMiddleware, deleteUserProduct);

//Open-market routes
router.get("/open-market/products", authMiddleware, getAllUserProducts);


export { router };