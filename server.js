const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const crypto = require("crypto");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;


// ==========================
// MIDDLEWARE
// ==========================

app.use(cors());

app.use(express.json());

app.use(express.static(__dirname));


// ==========================
// CLOUDINARY
// ==========================

cloudinary.config({

  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET

});


// ==========================
// MULTER
// ==========================

const upload = multer({

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    if (file.mimetype.startsWith("image/")) {

      cb(null, true);

    } else {

      cb(
        new Error("Only image files are allowed")
      );

    }

  }

});


// ==========================
// ADMIN SETTINGS
// ==========================

// These will come from Render Environment Variables.

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "admin";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "change-this-password";


// Temporary token storage.
//
// Later we can improve this with a stronger
// persistent authentication system.

const adminTokens = new Set();


// ==========================
// ADMIN LOGIN
// ==========================

app.post("/api/admin/login", (req, res) => {

  try {

    const {
      username,
      password
    } = req.body;

    if (!username || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Username and password are required"

      });

    }


    if (
      username !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD
    ) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid username or password"

      });

    }


    const token =
      crypto.randomBytes(32).toString("hex");


    adminTokens.add(token);


    res.json({

      success: true,

      message: "Admin login successful",

      token

    });

  } catch (error) {

    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    res.status(500).json({

      success: false,

      message: "Server error"

    });

  }

});


// ==========================
// ADMIN AUTH MIDDLEWARE
// ==========================

function adminAuth(req, res, next) {

  const authHeader =
    req.headers.authorization || "";


  if (!authHeader.startsWith("Bearer ")) {

    return res.status(401).json({

      success: false,

      message: "Admin authentication required"

    });

  }


  const token =
    authHeader.split(" ")[1];


  if (!adminTokens.has(token)) {

    return res.status(401).json({

      success: false,

      message: "Invalid or expired admin token"

    });

  }


  next();

}


// ==========================
// ADMIN UPLOAD
// ==========================

app.post(
  "/api/admin/upload",
  adminAuth,
  upload.single("image"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          success: false,

          message:
            "No image selected"

        });

      }


      const result =
        await new Promise(
          (resolve, reject) => {

            const stream =
              cloudinary.uploader.upload_stream(

                {
                  folder:
                    "luxora-jewels"
                },

                (error, result) => {

                  if (error) {

                    reject(error);

                  } else {

                    resolve(result);

                  }

                }

              );


            stream.end(
              req.file.buffer
            );

          }
        );


      res.json({

        success: true,

        message:
          "Image uploaded successfully",

        url:
          result.secure_url,

        publicId:
          result.public_id

      });

    } catch (error) {

      console.error(
        "UPLOAD ERROR:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Image upload failed"

      });

    }

  }
);


// ==========================
// TEST
// ==========================

app.get("/api/test", (req, res) => {

  res.json({

    success: true,

    message:
      "LUXORA server is working"

  });

});


// ==========================
// HOME
// ==========================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});


// ==========================
// START SERVER
// ==========================

app.listen(PORT, () => {

  console.log(
    `🚀 LUXORA server running on port ${PORT}`
  );

});
