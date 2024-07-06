import { Request, Response } from "express";
import Restaurant from "../models/restaurant";

// THIS WILL GET A SPECIFIC RESTAURANT BASE ON THE RESTAURANT ID
const getRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.params.restaurantId;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    // This automatically add the status of 200 whenever we did not specify the status
    res.json(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const searchRestaurants = async (req: Request, res: Response) => {
  try {
    // we will get the city name from the request parameter
    const city = req.params.city;

    // we will get any of the filtering, pagination or sorting if they are available
    const searchQuery = (req.query.searchQuery as string) || "";
    const selectedCuisines = (req.query.selectedCuisines as string) || "";
    const sortOption = (req.query.sortOption as string) || "lastUpdated";
    const page = parseInt(req.query.page as string) || 1;

    // we will create the query to search
    let query: any = {};

    query["city"] = new RegExp(city, "i");
    // count how many records we have in the table that has the city name we searched for base on the regExp above
    const cityCheck = await Restaurant.countDocuments(query);

    if (cityCheck === 0) {
      return res.status(404).json({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 1
        }
      });
    }

    // if we have records in our table bnase on the city searched, we will then do the query
    if (selectedCuisines) {
      // the url will be like selectedCuisines=italian,burgers,chinese
      // [italian, burgers, chinese]
      const cuisinesArray = selectedCuisines
        .split(",")
        .map((cuisine) => new RegExp(cuisine, "i"));

      query["cuisines"] = { $all: cuisinesArray };
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      query["$or"] = [
        { restaurantName: searchRegex },
        { cuisines: { $in: [searchRegex] } }
      ];
    }

    // for the pagination
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    // because sortOption is synamic, we have to put it in an array and 1  means ascending order
    // the lean will make the mongoose to return plain javascript object records instead of mongoose document
    // the lean strips off all the mongoose IDs and metadata and returns just the plain javascript object
    const restaurants = await Restaurant.find(query)
      .sort({ [sortOption]: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // we will get the total number of restaurants we could find base on our query/search
    const total = await Restaurant.countDocuments(query);

    const response = {
      data: restaurants,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / pageSize) // 50 resukts, pageSize = 10 .. pages will be 5
      }
    };

    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export default {
  getRestaurant,
  searchRestaurants
};
