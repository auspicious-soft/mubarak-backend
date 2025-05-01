import { Router } from "express";
import {  getAdminDetails,  } from "../controllers/admin/admin-controller";
import { createStore, deleteStore, getAllStores, getStoreById, updateStore } from "../controllers/stores/store-controller";
import {
  createStoreProduct,
  getAllStoreProducts,
  getStoreProductById,
  updateStoreProduct,
  deleteStoreProduct
} from "../controllers/store-products/store-products-controller";
import {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion
} from "../controllers/promotion/promotion-controller";
import { getAllUsers, getUserById } from "../controllers/users/users-controller";

const router = Router();

router.get("/", getAdminDetails);
// router.get("/dashboard", getDashboardStats);

//users routes
router.route("/users").get(getAllUsers);
router.route("/users/:id").get(getUserById);

//stores routes
router.route("/stores").post(createStore).get(getAllStores);
router.route("/stores/:id").get(getStoreById).put(updateStore).delete(deleteStore);

//store-products routes
router.route("/store-products").get(getAllStoreProducts);
router.route("/store-products/:id").get(getStoreProductById).delete(deleteStoreProduct);

//promotions routes
router.route("/promotions").post(createPromotion).get(getAllPromotions);
router.route("/promotions/:id").get(getPromotionById).put(updatePromotion).delete(deletePromotion);

export { router };
