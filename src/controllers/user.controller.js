import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/api.errors.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/api.response.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    // console.log(user);

    const accessToken = user.generateAcessToken();
    const refreshToken = user.generateRefreshToken(); //saved in database

    // console.log(accessToken, refreshToken);

    await User.findByIdAndUpdate(userId, {refreshToken}, {new: true});

    //.save method was not working that's why used findByIdAndUpdate()
    // user.refreshToken = refreshToken;
    // await user.save({validateBeforeSave: true}); // save without kickin other field

    console.log("user refresh token alloted");

    return {accessToken, refreshToken};
  } catch (err) {
    throw new ApiError(
      500,
      `something went wrong while generating refresh and access token ${err} `
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const {email, username, fullname, password, refreshToken} = req.body;

  // console.log(req.body);

  // get user details from frontend - done
  // validation - not empty
  if (
    [email, username, fullname, password].some((feild) => {
      return feild?.trim() === ""; //?. (optional chaining) prevents errors when accessing properties/methods of undefined or null.
    })
  ) {
    throw new ApiError(400, "all fields are required");
  }
  // if user already exits - through username , email
  const existedUser = await User.findOne({$or: [{username}, {email}]});

  if (existedUser) {
    throw new ApiError(409, "username or email exist already");
  }
  // console.log(req.files);

  // check for images  , cheak for avtar
  const avatarLoacalPath = req.files?.avatar[0]?.path; // given by multer
  // const coverImageLoaclPath = req.files?.coverImage[0]?.path;

  if (!avatarLoacalPath) {
    throw new ApiError(400, "avatar is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // upload to clodinary , avtar
  const avatar = await uploadOnCloudinary(avatarLoacalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullname,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    password,
    refreshToken,
  });

  // remove password and refresh token feed from response
  const createdUser = await User.findById(user._id).select(
    // . (select): removes -password and -refreshToken
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

const loginUser = asyncHandler(async (req, res) => {
  // req body —> data
  const {email, username, password} = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // find the user   // username or email
  const userSearched = await User.findOne({$or: [{email}, {username}]});

  if (!userSearched) {
    throw new ApiError(404, "user does not exists");
  }

  //password check
  const isPasswordValid = await userSearched.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  //access and referesh token
  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
    userSearched._id
  );
  const logedInUser = await User.findById(userSearched._id).select(
    "-password -refreshToken"
  );

  // send cookie - cookies can be modified from any where so to not allow that we use this
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {user: logedInUser, accessToken, refreshToken},
        "user Login Succesfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //set refresh token to null
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {refreshToken: 1}, // 1 removes the field from the document
    },
    {new: true}
  );

  const Options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", Options) // clear all cookies
    .clearCookie("refreshToken", Options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw ApiError(400, "invalid refresh token");
    }

    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      REFRESH_TOKEN_SECRET
    );

    // req se user ka data nikal ke refresh token compare karana hai
    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw ApiError(400, "user not found");
    }

    // agar  refresh token exist - grannt access token  karna hai cookie me

    if (user?.refreshToken !== incomingRefreshToken) {
      throw ApiError(401, "invalid refresh token");
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {accessToken, refreshToken},
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw ApiError(401, error.message || "invalid refresh token");
  }
});

export {registerUser, loginUser, logoutUser, refreshAccessToken};
