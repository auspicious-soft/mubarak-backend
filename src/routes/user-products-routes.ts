import { Router } from "express";
import {
  createUserProduct,
  getAllUserProducts,
  getUserProductsByUserId,
  getUserProductById,
  updateUserProduct,
  deleteUserProduct,
  updateUserProductStatus
} from "../controllers/user-products/user-products-controller";

const router = Router();

// Create a new product
// router.post("/", createUserProduct);

// Get all products (with filtering and pagination)
// router.get("/", getAllUserProducts);

// Get products by user ID
router.get("/user/:userId", getUserProductsByUserId);

// Get my products (for authenticated user)
// router.get("/my-products", getUserProductsByUserId);

// Get, update, delete product by ID
router.route("/:id")
  .get(getUserProductById)
  .put(updateUserProduct)
  .delete(deleteUserProduct);

// Update product status
// router.patch("/:id/status", updateUserProductStatus);

export { router };
