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

const router = Router();

router.get("/", getAdminDetails);
// router.get("/dashboard", getDashboardStats);



//store-products routes
router.route("/store-products").post(createStoreProduct).get(getAllStoreProducts);
router.route("/store-products/:id").get(getStoreProductById).put(updateStoreProduct).delete(deleteStoreProduct);


export { router };
