import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Schema for Sub-Sections (used in Additional Sections)
const subSectionSchema = new Schema({
  subHeading: {
    type: String,
    trim: true,
    required: false // Optional subHeading
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
});

// Schema for Additional Sections (heading + array of sub-sections)
const additionalSectionSchema = new Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  subSections: {
    type: [subSectionSchema],
    default: []
  }
});

// Schema for Long Description (remains the same)
// const descriptionSchema = new Schema({
//   heading: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   description: {
//     type: String,
//     required: true,
//     trim: true
//   }
// });

// Schema for Price Details
const priceDetailsSchema = new Schema({
  price: {
    type: Number,
    required: true,
    min: 0
  },
  packSize: {
    type: String,
    required: true,
    min: 1
  },
  numberOfUnits: {
    type: Number,
    required: true,
    min: 1
  }
});

// Schema for Availability
// const availabilitySchema = new Schema({
//   inStock: {
//     type: Boolean,
//     required: true,
//     default: false
//   },
//   availabilityDate: {
//     type: Date,
//     required: false
//   }
// });

// Main Product Schema
const storeProductSchema = new Schema({
 
  storeId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: [String],
    // required: true,
    trim: true
  },
  priceDetails: {
    type: [priceDetailsSchema],
    default: [],
    validate: {
      validator: function (arr : any) {
        return arr.length > 0;
      },
      message: 'At least one price detail is required.'
    }
  },
  // availability: {
  //   type: availabilitySchema,
  //   required: true
  // },
  longDescriptions: {
    type: String,
    required: false,
    trim: true
  },
  additionalSections: {
    type: [additionalSectionSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field on save
// productSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

export const storeProductModel = mongoose.model("storeProduct", storeProductSchema);
