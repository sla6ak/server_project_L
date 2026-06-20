import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  nickName: {
    type: String,
    unique: true,
    required: [true, "Nickname is required"],
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },

  password: {
    type: String,
    required: [true, "Password is required"],
  },
  online: {
    type: Boolean,
    default: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  lastLoginDate: { type: Date },
});

const UserModel = model("User", UserSchema);
export default UserModel;
