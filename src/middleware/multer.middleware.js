import multer from "multer";

const storage = multer.diskStorage({
  // store in disk so that ram don't fill up
  destination: function (req, file, cb) {
    // req me sab ajat ahia json wagera par file nahi aati esliye file parameter hai multer ke pass
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname); // file name me boot saare options hote hai agar orignal name se kara to boot saari file ek name se aa sakti hai dikkat ho sakti hai
    // par ye boot hi jaldi hota hai to as such koi dikkat nahi hoti hai
  },
});

export const upload = multer({storage});
