const app = require("./app");
const connectDb = require("./config/mongodb-config");

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();