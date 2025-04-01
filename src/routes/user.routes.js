import {Router} from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js";
import {verifyJWT} from "../middleware/auth.middleware.js";

const router = Router();

// upload field middleware and function - register user(middleware added in route adds data in req to use in registerUser)
router.route("/register").post(
  upload.fields([
    {name: "avatar", maxCount: 1},
    {name: "coverImage", maxCount: 1},
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes

router.route("/logout").post(verifyJWT, logoutUser);

export default router;
