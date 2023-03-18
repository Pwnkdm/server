const User = require("../models/user");
const Post = require("../models/post");
const { sendEmail } = require("../middlewares/sendEmail");
const crypto = require("crypto");

// for ragistering user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ sucess: false, messssage: "User already exists" });
    }

    user = await User.create({
      name,
      email,
      password,
      avatar: { public_id: "sampleId", url: "Sampleurl" },
    });

    const token = await user.generateToken();

    const options = {
      expires: new Date(Date.now() + 10 * 60 * 1000),
      httpOnly: true,
    };

    res
      .status(201)
      .cookie("token", token, options)
      .json({ sucess: true, user, token });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

// for Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ sucess: false, message: "User does not exist" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ sucess: false, message: "Incorrect Password" });
    }

    const token = await user.generateToken();

    const options = {
      expires: new Date(Date.now() + 10 * 60 * 1000),
      httpOnly: true,
    };

    res
      .status(200)
      .cookie("token", token, options)
      .json({ sucess: true, user, token });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

// function for Logout
exports.logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
      .json({ success: true, message: "logged Out" });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

// function for follow and unfallow user
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ sucess: false, message: "User not found" });
    }

    if (loggedInUser.following.includes(userToFollow._id)) {
      const indexFollowing = loggedInUser.following.indexOf(userToFollow._id);
      loggedInUser.following.splice(indexFollowing, 1);

      const indexFollowers = loggedInUser.following.indexOf(userToFollow._id);
      userToFollow.followers.splice(indexFollowers, 1);

      await loggedInUser.save();
      await userToFollow.save();

      return res.status(200).json({ sucess: true, message: "user Unfollowed" });
    } else {
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);

      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({ sucess: true, message: "user followed" });
    }
  } catch (error) {
    req.status(500).json({ sucess: false, message: error.message });
  }
};

// function for updating Password

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        sucess: false,
        message: "Please provide old and new password",
      });
    }
    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
      res
        .status(400)
        .json({ sucess: false, message: "Incorrect Old Password" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ sucess: true, message: "Password updated" });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

// function for updating Profile

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email } = req.body;

    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }

    //User Avatar: TODO

    await user.save();

    res.status(200).json({ success: true, message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

// Delete profile function
exports.deleteMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = user.posts;
    const followers = user.followers;
    const following = user.following;
    const userId = user._id;

    await User.deleteOne();

    //Logout user after deleting profile
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    // Delete all posts of the user
    for (let i = 0; i < posts.length; i++) {
      const post = await Post.findOne(posts[i]);
      await post.deleteOne();
    }

    // Removing user from followers following
    for (let i = 0; i < followers.length; i++) {
      const follower = await User.findById(followers[i]);

      const index = follower.following.indexOf(userId);
      follower.following.splice(index, 1);
      await follower.save();
    }

    // Removing user from followings follower
    for (let i = 0; i < following.length; i++) {
      const follows = await User.findById(following[i]);

      const index = follows.followers.indexOf(userId);
      follows.followers.splice(index, 1);
      await follows.save();
    }

    res.status(200).json({ sucess: true, message: "Profile deleted" });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
};

// function for getting profile
exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("posts");

    res.status(200).json({ sucess: true, user });
  } catch (error) {
    req.status(500).json({ sucess: false, error: error.message });
  }
};

// function for getting requested profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("posts");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ sucess: true, user });
  } catch (error) {
    req.status(500).json({ sucess: false, error: error.message });
  }
};

// function for getting all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});

    res.status(200).json({
      sucess: true,
      users,
    });
  } catch (error) {
    req.status(500).json({ sucess: false, error: error.message });
  }
};

// function for forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ sucess: false, message: "User not found" });
    }

    const resetPasswordToken = await user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetPasswordToken}`;

    const message = `Reset Your Password by clicking on the link below: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });

      res.status(200).json({
        success: true,
        message: `Reset password mail sent to ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      res.status(500).json({ sucess: false, error: error.message });
    }
  } catch (error) {
    res.status(500).json({ sucess: false, error: error.message });
  }
};

// function for reset password
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetTokenExpire: { $gt: Date.now() },
    });
    console.log(resetPasswordToken);

    if (!user) {
      return res
        .status(401)
        .json({ sucess: false, message: "Token is invalid or expired" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.status(200).json({ sucess: true, message: "Password updated" });
  } catch (error) {
    res.status(500).json({ sucess: false, error: error.message });
  }
};
