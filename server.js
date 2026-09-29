const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const crypto = require("crypto");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// ========================================
// CLOUDINARY
// ========================================

cloudinary.config({
  secure: true
});


// ========================================
// MULTER
// ========================================

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


// ========================================
// ADMIN SETTINGS
// ========================================

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "admin";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "change-this-password";


// Token storage
const adminTokens = new Map();


// ========================================
// WEBSITE IMAGE SLOTS
// ========================================

const IMAGE_SLOTS = {

  hero: {
    name: "Hero Image",
    publicId: "hero"
  },

  about: {
    name: "About Image",
    publicId: "about"
  },

  collection1: {
    name: "Collection 1",
    publicId: "collection-1"
  },

  collection2: {
    name: "Collection 2",
    publicId: "collection-2"
  },

  collection3: {
    name: "Collection 3",
    publicId: "collection-3"
  },

  gallery1: {
    name: "Gallery 1",
    publicId: "gallery-1"
  },

  gallery2: {
    name: "Gallery 2",
    publicId: "gallery-2"
  },

  gallery3: {
    name: "Gallery 3",
    publicId: "gallery-3"
  },

  gallery4: {
    name: "Gallery 4",
    publicId: "gallery-4"
  },

  gallery5: {
    name: "Gallery 5",
    publicId: "gallery-5"
  }

};


// ========================================
// CLOUDINARY FOLDER
// ========================================

const CLOUDINARY_FOLDER = "luxora-jewels";


// ========================================
// ADMIN LOGIN
// ========================================

app.post("/api/admin/login", (req, res) => {

  try {

    const {
      username,
      password
    } = req.body;


    if (!username || !password) {

      return res.status(400).json({

        success: false,
        message: "Username and password are required"

      });

    }


    if (
      username !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD
    ) {

      return res.status(401).json({

        success: false,
        message: "Invalid username or password"

      });

    }


    const token =
      crypto.randomBytes(32).toString("hex");


    adminTokens.set(token, {
      createdAt: Date.now()
    });


    res.json({

      success: true,
      message: "Admin login successful",
      token

    });

  } catch (error) {

    console.error("ADMIN LOGIN ERROR:", error);

    res.status(500).json({

      success: false,
      message: "Server error"

    });

  }

});


// ========================================
// ADMIN AUTH
// ========================================

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


  const session =
    adminTokens.get(token);


  if (!session) {

    return res.status(401).json({

      success: false,
      message: "Invalid admin session"

    });

  }


  // Session expires after 24 hours
  const sessionAge =
    Date.now() - session.createdAt;


  if (sessionAge > 24 * 60 * 60 * 1000) {

    adminTokens.delete(token);

    return res.status(401).json({

      success: false,
      message: "Admin session expired"

    });

  }


  next();

}


// ========================================
// GET ALL WEBSITE IMAGES
// ========================================

app.get(
  "/api/admin/images",
  adminAuth,
  async (req, res) => {

    try {

      const images = {};


      for (const [slot, config] of Object.entries(IMAGE_SLOTS)) {

        try {

          const result =
            await cloudinary.api.resource(
              `${CLOUDINARY_FOLDER}/${config.publicId}`,
              {
                resource_type: "image"
              }
            );


          images[slot] = {

            exists: true,

            name: config.name,

            url: result.secure_url,

            publicId: result.public_id

          };

        } catch (error) {

          images[slot] = {

            exists: false,

            name: config.name,

            url: "",

            publicId: ""

          };

        }

      }


      res.json({

        success: true,
        images

      });

    } catch (error) {

      console.error(
        "GET IMAGES ERROR:",
        error
      );

      res.status(500).json({

        success: false,
        message: "Unable to load website images"

      });

    }

  }
);


// ========================================
// UPLOAD / REPLACE IMAGE
// ========================================

app.post(
  "/api/admin/images/:slot",
  adminAuth,
  upload.single("image"),
  async (req, res) => {

    try {

      const slot =
        req.params.slot;


      const config =
        IMAGE_SLOTS[slot];


      if (!config) {

        return res.status(400).json({

          success: false,
          message: "Invalid image slot"

        });

      }


      if (!req.file) {

        return res.status(400).json({

          success: false,
          message: "No image selected"

        });

      }


      const result =
        await new Promise(
          (resolve, reject) => {

            const stream =
              cloudinary.uploader.upload_stream(

                {

                  folder:
                    CLOUDINARY_FOLDER,

                  public_id:
                    config.publicId,

                  overwrite: true,

                  invalidate: true,

                  resource_type: "image"

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

        message:
          `${config.name} updated successfully`,

        slot,

        url:
          result.secure_url,

        publicId:
          result.public_id

      });

    } catch (error) {

      console.error(
        "IMAGE UPLOAD ERROR:",
        error
      );

      res.status(500).json({

        success: false,
        message: "Image upload failed"

      });

    }

  }
);


// ========================================
// DELETE IMAGE
// ========================================

app.delete(
  "/api/admin/images/:slot",
  adminAuth,
  async (req, res) => {

    try {

      const slot =
        req.params.slot;


      const config =
        IMAGE_SLOTS[slot];


      if (!config) {

        return res.status(400).json({

          success: false,
          message: "Invalid image slot"

        });

      }


      const result =
        await cloudinary.uploader.destroy(

          `${CLOUDINARY_FOLDER}/${config.publicId}`,

          {
            resource_type: "image",
            invalidate: true
          }

        );


      res.json({

        success: true,

        message:
          `${config.name} deleted successfully`,

        result:
          result.result

      });

    } catch (error) {

      console.error(
        "IMAGE DELETE ERROR:",
        error
      );

      res.status(500).json({

        success: false,
        message: "Image deletion failed"

      });

    }

  }
);


// ========================================
// PUBLIC WEBSITE IMAGES
// ========================================

app.get(
  "/api/site-images",
  async (req, res) => {

    try {

      const images = {};


      for (const [slot, config] of Object.entries(IMAGE_SLOTS)) {

        try {

          const result =
            await cloudinary.api.resource(
              `${CLOUDINARY_FOLDER}/${config.publicId}`,
              {
                resource_type: "image"
              }
            );


          images[slot] =
            result.secure_url;

        } catch (error) {

          images[slot] = "";

        }

      }


      res.json({

        success: true,
        images

      });

    } catch (error) {

      console.error(
        "PUBLIC IMAGES ERROR:",
        error
      );

      res.status(500).json({

        success: false,
        message: "Unable to load images"

      });

    }

  }
);


// ========================================
// TEST
// ========================================

app.get("/api/test", (req, res) => {

  res.json({

    success: true,
    message: "LUXORA server is working"

  });

});


// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

  console.log(
    `🚀 LUXORA server running on port ${PORT}`
  );

});
