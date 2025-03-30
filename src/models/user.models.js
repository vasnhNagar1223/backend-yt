import mongoose, {mongo} from "mongoose";
import {jwt} from "jsonwebtoken";
import {bcrypt} from "bcrypt";

const userSchema = new mongoose.Schema( // don't forget new
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true, //remove free space not of middle
      index: true, // improve the speed of queries by making searches faster. performace low karta hai to soch samajke use karna
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true, //remove free space not of middle
    },
    fullname: {
      type: String,
      required: true,
      trim: true, //remove free space not of middle ,
      index: true,
    },
    avatar: {
      type: String, //cloudnary url use kare ge aws - url dega wo yaha aae ga
      required: true,
    },
    coverImage: {
      type: String, //cloudnary url use kare ge aws - url dega wo yaha aae ga
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {timestamps: true}
);

// this contain all the fields in videoSchema and this can only be accessed in normal function syntax

userSchema.plugin(mongooseAggregatePaginate);
userSchema.pre("save", async function (req, res, next) {
  //pre hook middleware on save normal function
  if (!this.isModidied("password")) {
    return next();
  }
  this.password = bcrypt.hash(this.password, 10); //.hash (password  , no. of folds)
});

//custom methods - must be called manually
//methods is an object of methods/function
userSchema.methods.isPasswordCorrect = async function (password) {
  await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAcessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.ACCESS_TOKEN_STRING,
    {expiresIn: ACESS_TOKEN_EXPIRY}
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.REFRESH_TOKEN_SECRET,
    {expiresIn: REFRESH_TOKEN_EXPIRY}
  );
};

export const User = mongoose.model("User", userSchema);
