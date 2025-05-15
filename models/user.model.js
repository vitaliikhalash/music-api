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

// Format birthDate in JSON output
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
