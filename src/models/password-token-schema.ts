import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true, // Allows multiple null/undefined values
        trim: true,
        lowercase: true,
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    expires: {
        type: Date,
        required: true,
        // TTL index to automatically delete expired documents
        index: { expires: 0 } // MongoDB will delete the document when expires <= current time
    },
    phoneNumber: {
        type: String,
        required: false,
    }
});

// Create the model
export const passwordResetTokenModel = mongoose.model("passwordResetToken", passwordResetSchema);
