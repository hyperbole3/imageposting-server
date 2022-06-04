const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const authenticateToken = require("../jwt.js").authenticateToken;

// update
router.put("/:id", authenticateToken, async (req,res)=>{
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {$set: req.body});
      res.status(200).json("account has been updated");
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  } else {
    res.status(403).json("you can only update your own account");
  }
});

// delete
router.delete("/:id", authenticateToken, async (req,res)=>{
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    res.status(403).json("you can only delete your own account");
  }
});

// get
router.get("/", async (req,res)=>{
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId ? await User.findById(userId) : await User.findOne({username: username});
    if (!user) {
      return res.status(404).json("user doesnt exist");
    }
    const {password, updatedAt, ...other} = user._doc;
    res.status(200).json(other);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// get friends
router.get("/friends/:id", async (req,res) => {
  try {
    let user = await User.findById(req.params.id);
    const bothways = user.following.filter(value => user.followers.includes(value));
    const friends = await Promise.all(
      bothways.map(friendId => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map(friend => {
      const {_id, username, profilePicture, birthday} = friend;
      friendList.push({_id, username, profilePicture, birthday});
    });
    res.status(200).json(friendList);
  } catch(err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// follow
router.post("/:id/follow", authenticateToken, async (req,res)=>{
  if (req.body.userId !== req.params.id) {
    try {
      const targetUser = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!targetUser.followers.includes(req.body.userId)) {
        await targetUser.updateOne({$push: {followers: req.body.userId}});
        await currentUser.updateOne({$push: {following: req.params.id}});
        res.status(200).json("user has been followed");
      } else {
        res.status(403).json("already following user");
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cannot follow yourself");
  }
});

// unfollow
router.post("/:id/unfollow", authenticateToken, async (req,res)=>{
  if (req.body.userId !== req.params.id) {
    try {
      const targetUser = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (targetUser.followers.includes(req.body.userId)) {
        await targetUser.updateOne({$pull: {followers: req.body.userId}});
        await currentUser.updateOne({$pull: {following: req.params.id}});
        res.status(200).json("user has been unfollowed");
      } else {
        res.status(403).json("already unfollowing user");
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cannot unfollow yourself");
  }
});

router.get("/", (req,res)=>{
  res.send("user route");
});

module.exports = router;