import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const trackSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            required: true,
            ref: "User",
        },
        title: {
            type: String,
            required: false,
            trim: true,
            maxlength: [100, "Title must be at most 100 characters long"],
            validate: {
                validator: (value) => value === undefined || value.trim().length > 0,
                message: "Title cannot be an empty string",
            },
        },
        description: {
            type: String,
            required: false,
            trim: true,
            maxlength: [300, "Description must be at most 300 characters long"],
            validate: {
                validator: (value) => value === undefined || value.trim().length > 0,
                message: "Description cannot be an empty string",
            },
        },
        genre: {
            type: String,
            required: false,
            trim: true,
            maxlength: [50, "Genre must be at most 50 characters long"],
            validate: {
                validator: (value) => value === undefined || value.trim().length > 0,
                message: "Genre cannot be an empty string",
            },
        },
    },
    {
        timestamps: true,
    }
);

const Track = model("track", trackSchema);
export default Track;
