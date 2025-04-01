import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
  secure: true,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      //cheaks if path is coorect
      return null;
    }
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log(`file uploaded on cloudinary  `, response);

    fs.unlinkSync(localFilePath);

    return response;
  } catch (err) {
    fs.unlinkSync(localFilePath); //unlink in asynchronous form

    return null;
  }
};

export {uploadOnCloudinary};
