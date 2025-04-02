import {Router} from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js";
import {verifyJWT} from "../middleware/auth.middleware.js";

const router = Router();

// Multer Intercepts & Processes the File:
// Parses the multipart/form-data request.
// Stores the file temporarily in memory or disk.
// Attaches file details (req.file or req.files) to the request.

// upload field middleware and function - register user(middleware added in route adds data in req to use in registerUser)
router.route("/register").post(
  upload.fields([
    //upload.single for single file
    {name: "avatar", maxCount: 1},
    {name: "coverImage", maxCount: 1},
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes - secured routes mean user loged in hona chaiye

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreshToken").post(refreshAccessToken);

export default router;
