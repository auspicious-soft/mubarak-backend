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
import { createAddress, deleteAddress, getUserAddresses, updateAddress } from "../controllers/address/address-controller";
import {  getUserWishlistController, removeFromWishlistController, toggleWishlist } from "../controllers/wishlist/wishlist-controller";
import { addToCart, clearCart, getCart, removeCartItem, updateCartItem } from "../controllers/cart/cart-controller";
import { getStoreProductById, getStoreProductsByStoreIdForAdmin } from "../controllers/store-products/store-products-controller";

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
router.get("/store/product/:id",authMiddleware,getStoreProductById)
router.get("/store/:storeId/products", getStoreProductsByStoreIdForAdmin)

// ADDRESS
router.route("/address/user")
  .post(authMiddleware, createAddress)      
  .get(authMiddleware, getUserAddresses);  

// Routes for /address/:id
router.route("/address/:id")
  .patch(authMiddleware, updateAddress)  
  .delete(authMiddleware, deleteAddress);

// Route for WIshlist
router.post("/wishlist/add", authMiddleware, toggleWishlist);
router.get("/wishlist/get", authMiddleware, getUserWishlistController);
router.delete("/wishlist/remove", authMiddleware, removeFromWishlistController);

router.route("/cart/item")
  .post(authMiddleware, addToCart)
  .get(authMiddleware, getCart)
  .delete(authMiddleware, clearCart);

router.route("/cart/item/:itemId").patch(authMiddleware, updateCartItem)
  .delete(authMiddleware, removeCartItem);

//Open-market routes
router.get("/open-market/products", authMiddleware, getAllUserProducts);
router.get("/open-market/products/:id", authMiddleware, getUserProductById);

export { router };