import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import myUserRoute from "./routes/MyUserRoute";
import { v2 as cloudinary } from "cloudinary";
import myRestaurantRoute from "./routes/MyRestaurantRoute";

// connect to our mongodb database
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING as string)
  .then(() => console.log("Connected to database!"));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
// this will automatically convert the body of any api request to json so that we do not have to do it by ourselves
app.use(express.json());
app.use(cors());

// this is a basic endpoint we can call to check if the server has started
app.get("/health", async (req: Request, res: Response) => {
  res.send({ message: "health OK!" });
});

// /api/my/user
app.use("/api/my/user", myUserRoute);

// for restaurant
app.use("/api/my/restaurant", myRestaurantRoute);

app.listen(7000, () => {
  console.log("Server staretd on localhost:7000");
});
