import {Router} from "express";
import {registerUser} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js";

const router = Router();

// upload field middleware and function - register user(middleware added in route adds data in req to use in registerUser)
router.route("/register").post(
  upload.fields([
    {name: "avatar", maxCount: 1},
    {name: "coverImage", maxCount: 1},
  ]),
  registerUser
);

export default router;
