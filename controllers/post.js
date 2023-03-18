const Post = require("../models/post");
const User = require("../models/user");

//function for creating post
exports.createPost = async (req, res) => {
  try {
    const newPostData = {
      caption: req.body.caption,
      image: {
        public_id: "req.body.image",
        url: "http",
      },
      owner: req.user._id,
    };

    const post = await Post.create(newPostData);

    const user = await User.findById(req.user._id);
    user.posts.push(post._id);

    await user.save();

    res.status(201).json({ sucess: true, post });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

//function for deleting post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ sucess: false, message: "Post not found" });
    }

    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ sucess: false, message: "Unauthorized" });
    }

    await post.deleteOne();

    // also removing from array of posts in user model also
    const user = await User.findById(req.user._id);

    const index = user.posts.indexOf(req.params.id);
    user.posts.splice(index, 1);
    await user.save();

    res.status(200).json({ sucess: true, message: "Post deleted " });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

//function for like and disliking post
exports.likeAndUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ sucess: "false", message: "Post not found" });
    }

    if (post.likes.includes(req.user.id)) {
      const index = post.likes.indexOf(req.user.id);

      post.likes.splice(index, 1);

      await post.save();
      return res.status(200).json({ success: true, message: "Post Unliked" });
    } else {
      post.likes.push(req.user.id);
      await post.save();
      return res.status(200).json({ success: true, message: "Post liked" });
    }
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

//route for getting post of following
exports.getPostOfFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const posts = await Post.find({
      owner: {
        $in: user.following,
      },
    });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

// function for update caption

exports.updateCaption = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.owner.toString() !== req.user.id.toString()) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    post.caption = req.body.caption;
    await post.save();

    res.status(200).json({ success: true, message: "Caption updated" });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error });
  }
};

// function for posting comment
exports.commentOnPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ sucess: false, message: "Post not found" });
    }

    // checking if comment already exists
    let commentIndex = -1;
    post.comments.forEach((item, index) => {
      if (item.user.toString() === req.user._id.toString()) {
        commentIndex = index;
      }
    });

    if (commentIndex !== -1) {
      post.comments[commentIndex].comment = req.body.comment;

      await post.save();

      return res.status(200).json({ sucess: true, message: "comment updated" });
    } else {
      post.comments.push({
        user: req.user._id,
        comment: req.body.comment,
      });
      await post.save();
      return res.status(200).json({ sucess: true, message: "commented" });
    }
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

// function for deleting comment
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ sucess: false, message: "Post not found" });
    }

    // Checking if owner wants to delete
    if (post.owner.toString() === req.user._id.toString()) {
      if (req.body.commentId == undefined) {
        return res
          .status(400)
          .json({ sucess: false, message: "Comment Id required" });
      }

      post.comments.forEach((item, index) => {
        if (item._id.toString() === req.body.commentId.toString()) {
          return post.comments.splice(index, 1);
        }
      });

      await post.save();
      res
        .status(200)
        .json({ sucess: true, message: "Selected comment has deleted" });
    } else {
      post.comments.forEach((item, index) => {
        if (item.user.toString() === req.user._id.toString()) {
          return post.comments.splice(index, 1);
        }
      });

      await post.save();
      res
        .status(200)
        .json({ sucess: true, message: "Your comment has deleted" });
    }
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};
