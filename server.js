const express = require("express")
const env = require("dotenv")
const connectDb = require("./config/mongodb-config")
env.config()
const app = express()
connectDb()


app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(require("cors")());

app.use("/doner",require("./routes/donerRoutes"))




const port = process.env.PORT || 5000
app.listen(port,()=>{console.log(`server running on ${port}` );
})