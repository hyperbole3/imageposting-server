const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const fs = require("fs/promises");
const authenticateToken = require("../jwt.js").authenticateToken;

// create post
router.post("/post", authenticateToken, async (req,res)=>{
  try {
    const newPost = new Post(req.body);
    const post = await newPost.save();
    res.status(200).json(post);
  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// update post
router.put("/post/:id", authenticateToken, async (req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId == req.body.userId) {
      await post.updateOne({$set: req.body});
      res.status(200).json("post updated");
    } else {
      res.status(403).json("cannot update someone elses post");
    }
    
  } catch(err) {
    res.status(500).json(err);
  }
});

// delete post
router.delete("/post/:id", authenticateToken, async (req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId == req.body.userId) {
      const postImgFile = post.img;
      await post.deleteOne();
      const PF = process.env.PF;
      if (postImgFile) {
        console.log("deleting file "+ PF + postImgFile);
        await fs.unlink(PF + postImgFile);
      }
      res.status(200).json("post deleted");
    } else {
      res.status(403).json("cannot delete someone elses post");
    }
  } catch(err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// like post
router.put("/post/:id/like", authenticateToken, async (req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId != req.body.userId) {
      if (!post.likes.includes(req.body.userId)) {
        await post.updateOne({$set: {likeCount: post.likes.length+1}});
        await post.updateOne({$push: {likes: req.body.userId}});
        res.status(200).json("post liked");
      } else {
        await post.updateOne({$set: {likeCount: post.likes.length-1}});
        await post.updateOne({$pull: {likes: req.body.userId}});
        res.status(200).json("post unliked");
      }
    } else {
      res.status(403).json("cannot like your own post");
    }
  } catch(err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// get timeline posts
router.get("/post/timeline/:userId", async (req,res)=>{
  try {
    const currentUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({userId: currentUser._id});

    const friendPosts = await Promise.all(
      currentUser.following.map(friendId => {
        return Post.find({userId: friendId});
      })
    );
    res.status(200).json(userPosts.concat(...friendPosts));
  } catch(err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// get all users' posts
router.get("/post/profile/:username", async (req,res)=>{
  try {
    const currentUser = await User.findOne({username: req.params.username});
    if (!currentUser) {
      return res.status(404).json("user doesnt exist");
    }
    const userPosts = await Post.find({userId: currentUser._id});
    res.status(200).json(userPosts);
  } catch(err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// get new posts
router.get("/post/newest", async (req,res)=>{
  try {
    Post
    .find({})
    .sort({'createdAt': -1})
    .limit(20)
    .exec((err, posts) => {
      res.status(200).json(posts);
    });
  } catch(err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// get top posts
router.get("/post/top", async (req,res)=>{
  try {
    Post
    .find({})
    .sort({'likeCount': -1})
    .limit(20)
    .exec((err, posts) => {
      res.status(200).json(posts);
    });
  } catch(err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// get post
router.get("/post/:id", async (req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch(err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.get("/", (req,res)=>{
  res.send("posts route");
});


// when Post.likeCount was introduced:
async function updateLikeCounts() {
  const posts = await Post.find({});
  await Promise.all(posts.map((post) => {
    post.likeCount = post.likes.length;
    return post.save();
  }));
}


module.exports = router;