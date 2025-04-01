import {ApiError} from "../utils/api.errors.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    //Authorization: Bearer abcdefghijklmnop
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); //.reaplace - js method replace particular string from a string

    if (!token) {
      throw new ApiError(401, "Unauthorized token");
    }
    // it take token and scret key for that token to get information out
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_STRING);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "invalid access token");
    }

    req.user = user; // made an new field in req object name .user
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "invalid access token");
  }
});
