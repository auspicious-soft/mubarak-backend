import mongoose from "mongoose";



const promotionsSchema = new mongoose.Schema({
  
    storeName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'store',
      requried: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    banner: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const promotionsModel = mongoose.model("promotion", promotionsSchema);
