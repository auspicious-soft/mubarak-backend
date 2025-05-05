import { Router } from "express";
import {  getAdminDetails,  } from "../controllers/admin/admin-controller";
import { createStore, deleteStore, getAllStores, getStoreById, getStoreProfile, updateStore } from "../controllers/stores/store-controller";
import {
  createStoreProduct,
  getAllStoreProducts,
  getStoreProductById,
  updateStoreProduct,
  deleteStoreProduct
} from "../controllers/store-products/store-products-controller";


const router = Router();

router.route("/profile/:id").get(getStoreProfile).put(updateStore);

// router.get("/dashboard", getDashboardStats);


//store-products routes
router.route("/store-products").post(createStoreProduct).get(getAllStoreProducts);
router.route("/store-products/:id").get(getStoreProductById).put(updateStoreProduct).delete(deleteStoreProduct);


export { router };
