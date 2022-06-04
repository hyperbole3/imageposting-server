const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");

// search username/city
router.get("/user", async (req,res)=>{
  const username = req.query.username;
  const city = req.query.city;
  const searchParam = {};
  if (username) {
    username.replace(/[^0-9a-zA-Z]/gi, '');
    searchParam.username = new RegExp(username, 'i'); // i for case insensitive
  } else if (city) {
    city.replace(/[^0-9a-zA-Z]/gi, '');
    searchParam.city = new RegExp(city, 'i'); // i for case insensitive
  } else {
    return res.status(400).json("invalid search parameter");
  }
  console.log(searchParam);

  try {
    const users = await User.find(searchParam);
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// search text in post
router.get("/post", async (req,res)=>{
  const text = req.query.text;
  try {
    text.replace(/[^0-9a-zA-Z]/gi, '');
    const regex = new RegExp(text, 'i'); // i for case insensitive
    const posts = await Post.find({desc: {$regex: regex}});
    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
