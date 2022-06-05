const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const usersRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");
const searchRoute = require("./routes/search");
const multer = require("multer");
const path = require("path");

const app = express();
dotenv.config();

mongoose.connect(process.env.MONGO_URL, ()=>{
  console.log("mongoDB connected.");
}).catch(err => {
  console.log(err);
});

app.use("/images", express.static(path.join(__dirname, "public/images")));

// middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
})

const upload = multer({storage: storage});
app.post("/api/upload", upload.single("file"), (req,res) => {
  try {
    return res.status(200).json({filename: req.file.filename});
  } catch (err) {
    console.log(err);
  }
});

app.use("/api/users", usersRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postsRoute);
app.use("/api/search", searchRoute);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 8800;
app.listen(PORT, ()=>{
  console.log(`listening on port ${PORT}.`);
});