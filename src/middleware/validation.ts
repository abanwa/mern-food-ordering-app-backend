import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

const handleValidationErrors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  }

  next();
};

// This reason this is an array is because we are going to add this validation stuff as the middleware to our routes
// the way this will work is that whenever we receive a request to update user's profile, the express validator will  check the request  base n the request properties in the body we defined below. then it will call the handleValidationErrors , which will add all the errors to the request if error occurs. Then it will check the errors using validationResult(). if there is an error, it will return the error to the frontend. if there are no errors, it will go to the next function using the next()
export const validateMyUserRequest = [
  body("name").isString().notEmpty().withMessage("Name must be a string"),
  body("addressLine1")
    .isString()
    .notEmpty()
    .withMessage("AddressLine1 must be a string"),
  body("city").isString().notEmpty().withMessage("City must be a string"),
  body("country").isString().notEmpty().withMessage("Country must be a string"),
  handleValidationErrors
];
