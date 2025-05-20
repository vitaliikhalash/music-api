import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const playlistSchema = new Schema(
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
        trackIds: {
            type: [
                {
                    type: Types.ObjectId,
                    ref: "Track",
                },
            ],
            required: false,
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const Playlist = model("Playlist", playlistSchema);
export default Playlist;
