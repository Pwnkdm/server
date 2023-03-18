const app = require("./app");
const { connectDatabase } = require("./config/database");

app.listen(process.env.PORT, async () => {
  await connectDatabase();
  console.log(`Server is running on port ${process.env.PORT}`);
});
