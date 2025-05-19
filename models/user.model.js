import bcrypt from "bcrypt";
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        birthDate: { type: Date },
        gender: { type: String },
    },
    { versionKey: false },
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.set('toJSON', {
    transform: function (doc, ret) {
        if (ret.birthDate) {
            ret.birthDate = ret.birthDate.toISOString().split('T')[0];
        }
        return ret;
    },
});

const User = model('user', userSchema);
export default User;
