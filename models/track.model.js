const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const trackSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    duration: { type: Number, required: true },
    genre: { type: String, required: true },
    likes: { type: Number, default: 0 }
  },
  { versionKey: false }
);

const Track = model("track", trackSchema);
module.exports = Track;
