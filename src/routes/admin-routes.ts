import { Router } from "express";
import { getAdminDetails, getAdminDetailsById } from "../controllers/admin/admin-controller";
import { createStore, deleteStore, getAllStores, getStoreById, updateStore } from "../controllers/stores/store-controller";
import {
  createStoreProduct,
  getAllStoreProducts,
  getStoreProductById,
  updateStoreProduct,
  deleteStoreProduct,
  getStoreProductsByStoreIdForAdmin,
  getAllStoreProductsForAdmin,
  getStoreProductByIdForAdmin
} from "../controllers/store-products/store-products-controller";
import {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion
} from "../controllers/promotion/promotion-controller";
import { getAllUsers, getUserById } from "../controllers/users/users-controller";
import { deleteUserProduct, getAllUserProducts, getAllUserProductsForAdmin, getUserProductById, getUserProductsByUserId, getUserProductsByUserIdForAdmin, updateUserProduct } from "../controllers/user-products/user-products-controller";
import { checkWebAuth } from "../middleware/check-auth";

const router = Router();

router.get("/", checkWebAuth, getAdminDetails);
router.get("/admin-detail",getAdminDetailsById)
// router.get("/dashboard", getDashboardStats);

//users routes
router.route("/users").get(getAllUsers);
router.route("/users/:id").get(getUserById);
router.get("/user/:userId/products", getUserProductsByUserIdForAdmin);
router.route("/user-products/:id")
  .get(getUserProductById)
  .delete(deleteUserProduct);

router.get("/user/products",getAllUserProductsForAdmin);  

//stores routes
router.route("/stores").post(createStore).get(getAllStores);
router.route("/stores/:id").get(getStoreById).put(updateStore).delete(deleteStore);

// New route for admin to get products of a specific store
router.get("/stores/:storeId/products", getStoreProductsByStoreIdForAdmin);

//store-products routes
router.route("/store-products").get(getAllStoreProductsForAdmin);
router.route("/store-products/:id").get(getStoreProductByIdForAdmin).delete(deleteStoreProduct);

//promotions routes
router.route("/promotions").post(createPromotion).get(getAllPromotions);
router.route("/promotions/:id").get(getPromotionById).put(updatePromotion).delete(deletePromotion);

export { router };
