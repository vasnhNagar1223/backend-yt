// require("dotenv").config({path: "./.env"});
import dotenv from "dotenv";

import connectDB from "./db/db.js";

dotenv.config({
  path: ".env",
});

connectDB();

// use IIFE
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); //link + name
//     app.on("error", (error) => {
//       console.log(error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`app is listning on ${process.env.PORT}`);
//     });
//   } catch (err) {
//     console.log(err);
//     throw err;
//   }
// })();
