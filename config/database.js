const mongoose = require("mongoose");

exports.connectDatabase = () => {
  mongoose
    .connect("mongodb://localhost:27017/insta")
    .then((con) => console.log(`Database connected:${con.connection.host}`))
    .catch((error) => console.log(error));
};
