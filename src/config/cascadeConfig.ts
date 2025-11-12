import mongoose from 'mongoose';

/**
 * Configuration for cascade delete operations
 */
interface CascadeConfig {
  // Define which models and fields should be cleaned up
  [modelName: string]: {
    // Models that reference this model
    references: Array<{
      model: string;           // Name of the referencing model
      field: string;           // Field name that contains the reference
      deleteDocument?: boolean; // If true, delete the entire document; if false, just unset the field
      isArray?: boolean;       // If the field is an array of references
      cascade?: boolean;       // If true, trigger cascade delete on the deleted documents
      pullFromArray?: boolean; // If true, pull the item from array instead of deleting document
    }>;
  };
}

/**
 * Cascade delete configuration mapping
 */
const cascadeConfig: CascadeConfig = {
  user: {
    references: [
      { model: 'address', field: 'userId', deleteDocument: true },
      { model: 'cart', field: 'userId', deleteDocument: true },
      { model: 'wishlist', field: 'userId', deleteDocument: true },
      { model: 'userProduct', field: 'userId', deleteDocument: true },
      { model: 'productReview', field: 'userId', deleteDocument: true },
      { model: 'notification', field: 'recipients.recipientId', deleteDocument: false, isArray: true },
    ],
  },
  store: {
    references: [
      { model: 'storeProduct', field: 'storeId', deleteDocument: true, cascade: true }, // Will trigger storeProduct's own cascade
      { model: 'promotion', field: 'storeName', deleteDocument: true },
      { model: 'notification', field: 'recipients.recipientId', deleteDocument: false, isArray: true },
    ],
  },
  storeProduct: {
    references: [
      { model: 'cart', field: 'items.storeProduct', deleteDocument: false, isArray: true, pullFromArray: true },
      { model: 'wishlist', field: 'productId', deleteDocument: true },
      { model: 'productReview', field: 'productId', deleteDocument: true },
    ],
  },
  userProduct: {
    references: [
      { model: 'wishlist', field: 'productId', deleteDocument: true },
    ],
  },
  address: {
    references: [
      { model: 'cart', field: 'addressId', deleteDocument: false },
    ],
  },
};

/**
 * Plugin to handle cascade deletes and reference cleanup
 */
export function cascadeDeletePlugin(schema: mongoose.Schema, options: { modelName: string }) {
  const { modelName } = options;

  // Handle findOneAndDelete
  schema.pre('findOneAndDelete', async function (next) {
    try {
      const doc = await this.model.findOne(this.getFilter());
      if (doc) {
        await cleanupReferences(modelName, doc._id);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Handle findByIdAndDelete (internally uses findOneAndDelete but good to be explicit)
  schema.pre('findByIdAndDelete', async function (next) {
    try {
      const doc = await this.model.findOne(this.getFilter());
      if (doc) {
        await cleanupReferences(modelName, doc._id);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Handle findOneAndRemove
  schema.pre('findOneAndRemove', async function (next) {
    try {
      const doc = await this.model.findOne(this.getFilter());
      if (doc) {
        await cleanupReferences(modelName, doc._id);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Handle findByIdAndRemove
  schema.pre('findByIdAndRemove', async function (next) {
    try {
      const doc = await this.model.findOne(this.getFilter());
      if (doc) {
        await cleanupReferences(modelName, doc._id);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Handle deleteOne (query middleware)
  schema.pre('deleteOne', { document: false, query: true }, async function (next) {
    try {
      const doc = await this.model.findOne(this.getFilter());
      if (doc) {
        await cleanupReferences(modelName, doc._id);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Handle deleteOne (document middleware)
  schema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
      await cleanupReferences(modelName, this._id);
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Handle deleteMany
  schema.pre('deleteMany', async function (next) {
    try {
      const docs = await this.model.find(this.getFilter());
      for (const doc of docs) {
        await cleanupReferences(modelName, doc._id);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Handle document.remove() - deprecated but still supported
  schema.pre('remove', async function (next) {
    try {
      await cleanupReferences(modelName, this._id);
      next();
    } catch (error: any) {
      next(error);
    }
  });
}

/**
 * Clean up all references to a deleted document
 */
async function cleanupReferences(modelName: string, documentId: mongoose.Types.ObjectId) {
  const config = cascadeConfig[modelName];
  if (!config) return;

  const cleanupPromises = config.references.map(async (ref) => {
    const ReferencingModel = mongoose.model(ref.model);

    if (ref.deleteDocument) {
      // Delete entire documents that reference this one
      if (ref.isArray) {
        // For nested array fields (like notification recipients)
        const docsToDelete = await ReferencingModel.find({
          [ref.field]: documentId,
        });
        
        // Delete and cascade if needed
        for (const doc of docsToDelete) {
          if (ref.cascade) {
            await cleanupReferences(ref.model, doc._id);
          }
          await ReferencingModel.deleteOne({ _id: doc._id });
        }
      } else {
        // For direct references
        const docsToDelete = await ReferencingModel.find({
          [ref.field]: documentId,
        });
        
        // Delete and cascade if needed
        for (const doc of docsToDelete) {
          if (ref.cascade) {
            // Recursively trigger cleanup for this document
            await cleanupReferences(ref.model, doc._id);
          }
          await ReferencingModel.deleteOne({ _id: doc._id });
        }
      }
    } else {
      // Just unset the reference field or remove from array
      if (ref.isArray) {
        if (ref.field.includes('.')) {
          // Handle nested fields like 'items.storeProduct'
          const [arrayField, nestedField] = ref.field.split('.');
          
          if (ref.pullFromArray) {
            // Pull the specific item from the array (for cart items)
            await ReferencingModel.updateMany(
              { [`${arrayField}.${nestedField}`]: documentId },
              { $pull: { [arrayField]: { [nestedField]: documentId } } }
            );
            
            // Update totalItems for carts after removing items
            if (ref.model === 'cart') {
              const carts = await ReferencingModel.find({ [`${arrayField}.${nestedField}`]: { $exists: true } });
              for (const cart of carts) {
                // Recalculate totalItems
                const updatedCart = await ReferencingModel.findById(cart._id);
                if (updatedCart) {
                  updatedCart.totalItems = updatedCart.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
                  await updatedCart.save();
                }
              }
            }
          } else {
            // For other nested arrays - remove the item from the array
            await ReferencingModel.updateMany(
              { [`${arrayField}.${nestedField}`]: documentId },
              { $pull: { [arrayField]: { [nestedField]: documentId } } }
            );
            
            // Update totalItems for carts
            if (ref.model === 'cart') {
              const carts = await ReferencingModel.find({});
              for (const cart of carts) {
                cart.totalItems = cart.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
                await cart.save();
              }
            }
          }
        } else {
          // For arrays at the root level - pull from notification recipients
          await ReferencingModel.updateMany(
            {},
            { $pull: { recipients: { recipientId: documentId } } }
          );
        }
      } else {
        // Unset single reference field
        await ReferencingModel.updateMany(
          { [ref.field]: documentId },
          { $unset: { [ref.field]: "" } }
        );
      }
    }
  });

  await Promise.all(cleanupPromises);
}

/**
 * Utility function to manually trigger cascade delete
 * Useful for bulk operations or manual cleanup
 */
export async function manualCascadeDelete(modelName: string, documentId: mongoose.Types.ObjectId) {
  await cleanupReferences(modelName, documentId);
}

/**
 * ============================================
 * COMPLETE PLUGIN IMPLEMENTATION FOR ALL MODELS
 * ============================================
 * 
 * Add these lines to your respective model files:
 */

// ===== addressModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// addressSchema.plugin(cascadeDeletePlugin, { modelName: 'address' });

// ===== adminModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// adminSchema.plugin(cascadeDeletePlugin, { modelName: 'admin' });

// ===== cartModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// cartSchema.plugin(cascadeDeletePlugin, { modelName: 'cart' });

// ===== notificationModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// notificationSchema.plugin(cascadeDeletePlugin, { modelName: 'notification' });

// ===== promotionsModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// promotionsSchema.plugin(cascadeDeletePlugin, { modelName: 'promotion' });

// ===== productReviewModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// reviewSchema.plugin(cascadeDeletePlugin, { modelName: 'productReview' });

// ===== storeProductModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// storeProductSchema.plugin(cascadeDeletePlugin, { modelName: 'storeProduct' });

// ===== storeModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// storeSchema.plugin(cascadeDeletePlugin, { modelName: 'store' });

// ===== userProductModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// userProductSchema.plugin(cascadeDeletePlugin, { modelName: 'userProduct' });

// ===== userModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// userSchema.plugin(cascadeDeletePlugin, { modelName: 'user' });

// ===== wishlistModel.ts =====
// import { cascadeDeletePlugin } from './cascadeDeletePlugin';
// wishlistSchema.plugin(cascadeDeletePlugin, { modelName: 'wishlist' });