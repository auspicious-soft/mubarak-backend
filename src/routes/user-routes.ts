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

const router = Router();

// Auth routes
router.post("/signup", userSignup);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);


// CRUD routes
router.route("/").get(getAllUsers);
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

//User-product routes
router.post("/user-products", createUserProduct);
router.get("/my-products/:userId", getUserProductsByUserId);
router.route("/user-products/:id")
  .get(getUserProductById)
  .put(updateUserProduct)
  .delete(deleteUserProduct);

//Open-market routes
router.get("/open-market/products", getAllUserProducts);


export { router };