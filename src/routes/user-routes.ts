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
  getUserHome,
  getUserHomeStores,
  getStoreAndProductsByid,

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
router.get("/my/products", authMiddleware, getUserProductsByUserId);
router.route("/user-products/:id")
  .get(authMiddleware, getUserProductById)
  .put(authMiddleware, updateUserProduct)
  .delete(authMiddleware, deleteUserProduct);

router.get("/home/data",authMiddleware,getUserHome)
router.get("/home/stores",authMiddleware,getUserHomeStores)
router.get("/home/stores/:id",authMiddleware,getStoreAndProductsByid)

//Open-market routes
router.get("/open-market/products", authMiddleware, getAllUserProducts);
router.get("/open-market/products/:id", authMiddleware, getUserProductById);


export { router };