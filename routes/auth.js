const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("../jwt.js");

// register
router.post("/register", async (req,res)=>{
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,//TODO more data
    });
    const user = await newUser.save();
    res.status(200).json(user);
  } catch(err) {
    res.status(400).json("user already exists");
  }
});

// login
router.post("/login", async (req,res)=>{
  try {
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
      res.status(404).json("user not found");
    } else {
      const validPassword = await bcrypt.compare(req.body.password, user.password);
      if (validPassword) {
        const accessToken = jwt.generateAccessToken(user.toJSON());
        const refreshToken = jwt.generateRefreshToken(user.toJSON());
        jwt.storeRefreshToken(refreshToken);
        res.status(200).json({user: user, accessToken: accessToken, refreshToken: refreshToken});
      } else {
        res.status(400).json("wrong password");
      }
    }
  } catch(err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.delete("/logout", async (req, res) => {
  jwt.deleteRefreshToken(req.body.token);
  res.status(204).end();
});

router.post("/token", async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) {
    return res.status(401).end();
  }
  if (!jwt.includesRefreshToken(refreshToken)) {
    return res.status(403).end();
  }
  jwt.verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).end();
    const {iat, ...unpackedUser} = user;
    const accessToken = jwt.generateAccessToken(unpackedUser);
    res.status(200).json({user: unpackedUser, accessToken: accessToken});
  });
});

module.exports = router;