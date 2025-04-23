import { Router } from "express";
import {  getAdminDetails,  } from "../controllers/admin/admin-controller";
import { createStore, deleteStore, getAllStores, getStoreById, updateStore } from "../controllers/stores/store-controller";

const router = Router();

router.get("/", getAdminDetails);
// router.get("/dashboard", getDashboardStats);


//stores routes
router.route("/stores").post(createStore).get(getAllStores)
router.route("/stores/:id").get(getStoreById).put(updateStore).delete(deleteStore);

export { router };
