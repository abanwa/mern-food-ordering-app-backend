import { Request, Response } from "express";
import User from "../models/user";

// this will get the current user
const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // we will find the user whose id in the databse is the same as the userId
    const currentUser = await User.findOne({ _id: req.userId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // we will return the current user
    res.json(currentUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const createCurrentUser = async (req: Request, res: Response) => {
  // 1. check if the user exists
  // 2. create the user if it doesn't exist
  // 3. return the user object to the calling client

  try {
    // get the auth0 id
    const { auth0Id } = req.body;
    const existingUser = await User.findOne({ auth0Id });

    if (existingUser) {
      return res.status(200).send();
    }

    // the auth0Id and email will be passed to the request body in the front end before sending to the backend to create user
    const newUser = new User(req.body);
    await newUser.save();

    // we will return the new user that is created
    res.status(201).json(newUser.toObject());
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating user" });
  }
};

const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    // we will destructure some properties from the request body
    const { name, addressLine1, country, city } = req.body;
    // get the user we are trying to update
    const user = await User.findById(req.userId);

    // check if the user exist in our database
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // we will update the user data base on the properties we got
    user.name = name;
    user.addressLine1 = addressLine1;
    user.city = city;
    user.country = country;

    await user.save();
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating user" });
  }
};

export default {
  getCurrentUser,
  createCurrentUser,
  updateCurrentUser
};
