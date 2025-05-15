import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const playlistSchema = new Schema(
    {
        title: String,
        trackIds: [{ type: Types.ObjectId, ref: 'Track' }],
        userId: { type: Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const Playlist = model('playlist', playlistSchema);
export default Playlist;
