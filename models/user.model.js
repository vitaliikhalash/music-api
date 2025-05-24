import validator from "validator";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters long"],
            maxlength: [20, "Username must be at most 20 characters long"],
            validate: [
                {
                    validator: (value) => /^[a-zA-Z0-9_]+$/.test(value),
                    message: "Username can only contain letters, numbers, and underscores",
                },
            ],
        },
        email: {
            type: String,
            required: [true, "User email address is required"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: (value) => validator.isEmail(value),
                message: "Invalid email address",
            },
        },
        passwordHash: {
            type: String,
            required: false,
        },
        phoneNumber: {
            type: String,
            required: false,
            trim: true,
            validate: {
                validator: (value) => !value || /^\+?[1-9]\d{1,14}$/.test(value),
                message: "Invalid phone number",
            },
        },
        birthDate: {
            type: Date,
            required: false,
            validate: {
                validator: function (value) {
                    const now = new Date();
                    if (value > now) {
                        return false;
                    }
                    const minDate = new Date();
                    minDate.setFullYear(now.getFullYear() - 120);
                    if (value < minDate) {
                        return false;
                    }
                    return true;
                },
                message: "Invalid birthdate",
            },
        },
        gender: {
            type: String,
            enum: [
                "male",
                "female",
                "other",
                "prefer not to say",
            ],
            required: false,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.virtual("password")
    .set(function (value) {
        this.$locals._password = value;
        if (!value) {
            this.invalidate("password", "Password is required");
        }
        if (value.length < 8) {
            this.invalidate("password", "Password must be at least 8 characters long");
        }
        if (value.length > 30) {
            this.invalidate("password", "Password must be at most 30 characters long");
        }
    })
    .get(function () {
        return this.$locals.password;
    });

userSchema.pre("save", async function (next) {
    try {
        if (this.$locals._password) {
            this.passwordHash = await bcrypt.hash(this.$locals._password, 12);
        }
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.passwordHash;
        if (ret.birthDate) {
            ret.birthDate = ret.birthDate.toISOString().split("T")[0];
        }
        return ret;
    },
});

const User = model("User", userSchema);
export default User;
