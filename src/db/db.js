import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}` // gives a promise back which can be used as .then .catch
    );
    console.log(
      `MongoDB succesfully connected !! DB HOST ${connectionInstance.connection.host}`
    );
  } catch (err) {
    console.log("MONGODB connection error : ", err);
    process.exit(1); // 1 if there is error 0 for success
  }
};

export default connectDB;
