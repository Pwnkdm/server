const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "config/config.env" });
}

//Using Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

//importing routes
const post = require("./routes/post");
const users = require("./routes/user");

//Using Routes
app.use("/api/v1", post);
app.use("/api/v1", users);

module.exports = app;
