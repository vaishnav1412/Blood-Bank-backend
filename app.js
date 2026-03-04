require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/donor", require("./routes/donorRoutes"));
app.use("/admin", require("./routes/adminRoutes"));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Something went wrong",
  });
});

module.exports = app;