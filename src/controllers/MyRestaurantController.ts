import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

// THIS IS TO GET AN EXISTING RESTAURANT
const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    // we will find the restaurant base on the logged in user id
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching restaurant" });
  }
};

// THIS IS TO CREATE A RESTAURANT
const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    // we will check if the user has an existing restaurant in our database. Each use will have one restaurant per user
    // if the user already has a restaurant, we will return and do nothing

    // we will search any restaurant that has a user id that matches the logged in user id
    const existingRestaurant = await Restaurant.findOne({ user: req.userId });

    if (existingRestaurant) {
      // 409 means there is a record existing already
      return res
        .status(409)
        .json({ message: "User restaurant already exists" });
    }

    // here, we will create the data url string that represent the image we got in the request.
    /*
    // 1. we will get the image from the request
    const image = req.file as Express.Multer.File;
    // convert the image to base64 string
    const base64Image = Buffer.from(image.buffer).toString("base64");
    const dataURI = `data:${image.mimetype};base64,${base64Image}`;

    //upload to cloudinary and it will return the url of the uploaded image
    const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
    */

    const imageUrl = await uploadImage(req.file as Express.Multer.File);

    // we will create a new restaurant base on the fields/column in the resturant table/model
    const restaurant = new Restaurant(req.body);
    // restaurant.imageUrl = uploadResponse.url;
    restaurant.imageUrl = imageUrl;
    // we want to link the current logged in user to the restaurant
    restaurant.user = new mongoose.Types.ObjectId(req.userId);
    restaurant.lastUpdated = new Date();
    // we will save the new restaurant we created
    await restaurant.save();

    res.status(201).send(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// THIS WILL UPDATE OUR RESTAURANT
const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    // we will find / get the restaurant we want to update base on the logged in user id
    const restaurant = await Restaurant.findOne({ user: req.userId });

    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    // we will update the restaurant we fetched
    restaurant.restaurantName = req.body.restaurantName;
    restaurant.city = req.body.city;
    restaurant.country = req.body.country;
    restaurant.deliveryPrice = req.body.deliveryPrice;
    restaurant.estimatedDeliveryTime = req.body.estimatedDeliveryTime;
    restaurant.cuisines = req.body.cuisines;
    restaurant.menuItems = req.body.menuItems;
    restaurant.lastUpdated = new Date();

    //we will update the image if we change or uploaded a new image
    if (req.file) {
      // first, we will upload the image to cloudinary and it will return the cloudinary image url
      const imageUrl = await uploadImage(req.file as Express.Multer.File);
      restaurant.imageUrl = imageUrl;
    }

    await restaurant.save();
    res.status(200).send(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// THIS FUNCTION WILL CREATE AN IMAGE BUFFER WITH THE IMAGE WE UPLOAD TO BASE64
const uploadImage = async (file: Express.Multer.File) => {
  // 1. we will get the image from the request
  const image = file;
  // convert the image to base64 string
  const base64Image = Buffer.from(image.buffer).toString("base64");
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;

  //upload to cloudinary and it will return the url of the uploaded image
  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

export default {
  getMyRestaurant,
  createMyRestaurant,
  updateMyRestaurant
};
