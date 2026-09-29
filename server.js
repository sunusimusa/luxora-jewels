const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }

  }
});


app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});


app.get("/api/test", (req, res) => {

  res.json({
    success: true,
    message: "LUXORA server is working"
  });

});


app.post(
  "/api/upload",
  upload.single("image"),

  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message: "No image selected"
        });

      }


      const result = await new Promise(
        (resolve, reject) => {

          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder: "luxora-jewels"
              },

              (error, result) => {

                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }

              }
            );

          stream.end(req.file.buffer);

        }
      );


      res.json({

        success: true,

        message: "Image uploaded successfully",

        url: result.secure_url,

        publicId: result.public_id

      });


    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message: "Image upload failed"

      });

    }

  }
);


app.listen(PORT, () => {

  console.log(
    `🚀 LUXORA server running on port ${PORT}`
  );

});
