import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/api.errors.js";
import {User} from "../models/user.models.js";
import {uloadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/api.response.js";

const registerUser = asyncHandler(async (req, res) => {
  const {email, username, fullname, password} = req.body;

  // get user details from frontend - done
  // validation - not empty
  if (
    [email, username, fullname, password].some((field) => {
      field?.trim() === ""; //?. (optional chaining) prevents errors when accessing properties/methods of undefined or null.
    })
  ) {
    throw new ApiError(400, "all fields are required");
  }
  // if user already exits - through username , email
  const existedUser = User.findOne({$or: [{username}, {email}]});

  if (existedUser) {
    throw new ApiError(409, "username or email exist already");
  }

  // check for images  , cheak for avtar
  const avatarLoacalPath = req.files?.avatar[0]?.path; // given by multer
  const coverImageLoaclPath = req.files?.coverImage[0]?.path;

  if (!avatarLoacalPath) {
    throw new ApiError(400, "avatar is required");
  }

  // upload to clodinary , avtar
  const avatar = await uloadOnCloudinary(avatarLoacalPath);
  const coverImage = await uloadOnCloudinary(coverImageLoaclPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    password,
  });

  // remove password and refresh token feed from response
  const createdUser = await User.findById(user._id).select(
    // . select removes -password and -refreshToken
    "-password -refreshToken"
  );

  // cheak for user creation
  if (!createdUser) {
    throw new ApiError(500, "some thing went wrong while registering user");
  }

  //return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered Succesfully"));
});

export {registerUser};
