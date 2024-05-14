/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MongoClient, GridFSBucket } = require("mongodb");
const fs = require("fs");
const JWT = require("jsonwebtoken");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const atlas =
  "mongodb+srv://brahmgaur17:26download12345@cluster0.bl32bqx.mongodb.net/Test";

const client = new MongoClient(atlas);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas1");
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
  }
}

connectToMongoDB();

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const db = client.db("Test");
    const bucket = new GridFSBucket(db);

    const uploadedFile = req.file;

    const { title, course, semester, unit } = req.body;

    const uploadStream = bucket.openUploadStream(uploadedFile.originalname, {
      metadata: {
        contentType: uploadedFile.mimetype,
        title,
        course,
        semester,
        unit,
      },
    });

    // Write the file buffer to GridFS
    uploadStream.end(uploadedFile.buffer);

    uploadStream.on("error", (error) => {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });

    uploadStream.on("finish", async () => {
      res.status(200).json({ message: "File uploaded successfully" });
    });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/pdfs", async (req, res) => {
  try {
    const db = client.db("Test");
    const bucket = new GridFSBucket(db);
    // console.log(req.query);
    const { currSem, currCourse, subjectName, unit } = req.query;
    console.log(req.query);
    const filter = {};

    if (currCourse) {
      filter["metadata.course"] = currCourse;
    }
    if (currSem) {
      filter["metadata.semester"] = currSem;
    }
    if (subjectName) {
      filter["metadata.title"] = subjectName;
    }
    if (unit) {
      filter["metadata.unit"] = unit;
    }
    console.log(filter);
    const files = await bucket.find(filter).toArray();
    // console.log(files);
    // Extract relevant file information
    const pdfs = files.map((file) => {
      return {
        filename: file.filename,
        contentType: file.contentType,
        uploadDate: file.uploadDate,
        title: file.metadata.title,
        semester: file.metadata.semester,
      };
    });

    res.status(200).json(pdfs);
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/download-pdf/:filename", async (req, res) => {
  try {
    const db = client.db("Test");
    const bucket = new GridFSBucket(db);

    const filename = req.params.filename;
    const downloadStream = bucket.openDownloadStreamByName(filename);

    // Set response headers
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");

    // Pipe the file stream to the response
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/view-pdf/:filename", async (req, res) => {
  try {
    const db = client.db("Test");
    const bucket = new GridFSBucket(db);

    const filename = req.params.filename;
    const downloadStream = bucket.openDownloadStreamByName(filename);

    // Set response headers
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");

    // Pipe the file stream to the response
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Error viewing PDF:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const users = [
  {
    id: 1,
    username: "PaPa_Rudy",
    password: "kakuDon", // Hashed password: "password"
  },
];

const SECRET_KEY = "secretkey"; // You should store this securely, e.g., environment variable

// Login route
app.post("/Login", (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate JWT token
  const token = JWT.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "1h" });
  console.log("Logged in Successfully.");
  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
