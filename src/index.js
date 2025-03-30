// require("dotenv").config({path: "./.env"});
import dotenv from "dotenv";

import connectDB from "./db/db.js";
import app from "./app.js";

dotenv.config({
  path: ".env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`server is runnig at PORT : ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log(error);
      throw error;
    });
  })
  .catch((err) => {
    console.log(`connection failed :  ${err.message}`);
  });

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
