import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/api.errors.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/api.response.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose, {mongo} from "mongoose";

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
      throw new ApiError(400, "invalid refresh token");
    }

    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // req se user ka data nikal ke refresh token compare karana hai
    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(400, "user not found");
    }

    // agar  refresh token exist - grannt access token  karna hai cookie me

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "invalid refresh token");
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
    throw new ApiError(401, error.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword} = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  console.log(isPasswordCorrect);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid password");
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed Succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

// agar koi file update kara rahe hai to uske controller alag se likne hai
// production level pe hota hai
const updateAccountDetails = asyncHandler(async (req, res) => {
  const {fullname, email} = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "all fields are required");
  }

  const updatedUserDetails = await User.findByIdAndUpdate(
    req.user?._id,
    {$set: {fullname, email}},
    {new: true}
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {updatedUserDetails},
        "account details updated successfully"
      )
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLoacalPath = req.file?.path;

  console.log(req.file);
  if (!avatarLoacalPath) {
    throw new ApiError(400, "avatar is required");
  }

  //avartar me url ajae ga
  const avatar = await uploadOnCloudinary(avatarLoacalPath);

  if (!avatar.url) {
    throw new ApiError(500, "error while uploading file ");
  }

  const updatedUserDetails = await User.findByIdAndUpdate(
    req.user._id,
    {$set: {avatar: avatar.url}},
    {new: true}
  ).select("-password -refreshToken ");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {updatedUserDetails},
        "cover Image uploaded Successfull"
      )
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, "error in uploading file");
  }

  const updatedUserDetails = await User.findByIdAndUpdate(
    req.user._id,
    {$set: {coverImage: coverImage.url}},
    {new: true}
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {updatedUserDetails},
        "cover Image uploaded Successfull"
      )
    );
});

// out put me arrays aate hai
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const {username} = req.params;
  if (!username) {
    throw new ApiError(400, "username not found");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username,
      },
      $lookup: {
        from: "subscriptions", // model ka name lower case aur prural ho jata hai
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
      $lookup: {
        from: "subscriptions", // model ka name lower case aur prural ho jata hai
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
      $addFields: {
        subscribeCount: {
          $size: "$subscribers",
        },
        subscribeToCount: {
          $size: "$subscribedTo",
        },
        isSubscriber: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscribers"]},
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribeCount: 1,
        subscribeToCount: 1,
        isSubscriber: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetched succesfully"));
});

//interview question - what is req.user_id - this is just string not mongo db id
const getWatchedHistory = asyncHandler(async (req, res) => {
  // aggeregation pipeline ka code as it ass jata hai to jab id jae gi to wo string me jae gi not objectId()
  //to usko solve karne ke liye mongoose object deta hai jo hum use kar sakte hai
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
      //sub pipeline ...................................
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watchhistory fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchedHistory,
};
