import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import myUserRoute from "./routes/MyUserRoute";
import { v2 as cloudinary } from "cloudinary";
import myRestaurantRoute from "./routes/MyRestaurantRoute";
import restaurantRoute from "./routes/RestaurantRoute";
import orderRoute from "./routes/OrderRoute";

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

app.use(cors());

// Here, if we convert it to stripe response from webhook to json, the validation will not match, so we will use it as the raw response. the raw only applies to the stripe webhook response
app.use("/api/order/checkout/webhook", express.raw({ type: "*/*" }));

// this will automatically convert the body of any api request to json so that we do not have to do it by ourselves
app.use(express.json());

// this is a basic endpoint we can call to check if the server has started
app.get("/health", async (req: Request, res: Response) => {
  res.send({ message: "health OK!" });
});

// /api/my/user
app.use("/api/my/user", myUserRoute);

// for restaurant
app.use("/api/my/restaurant", myRestaurantRoute);

// to search for our restauraants\\
app.use("/api/restaurant", restaurantRoute);

// to make our order payment on stripe
app.use("/api/order", orderRoute);

app.listen(7000, () => {
  console.log("Server staretd on localhost:7000");
});
