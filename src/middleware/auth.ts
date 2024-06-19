import { NextFunction, Request, Response } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import jwt from "jsonwebtoken";
import User from "../models/user";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      auth0Id: string;
    }
  }
}

// e.Handler (express handler) will check the authorization header of the bearer token behind the scene
export const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: "RS256"
});

// this will check for the authorization header token
export const jwtParse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // the the accessToken from the header. it's in the request
  const { authorization } = req.headers;

  // Bearer liuhuugdugfuwfwyfwuwfuwyfgufwiu
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }

  // get the token from the authorization string
  const token = authorization.split(" ")[1];

  try {
    const decode = jwt.decode(token) as jwt.JwtPayload;
    const auth0Id = decode.sub;

    const user = await User.findOne({ auth0Id });

    if (!user) {
      return res.sendStatus(401);
    }

    // we will add the auth0Id to the request body
    // console.log("user ", user);
    req.auth0Id = auth0Id as string;
    req.userId = user._id.toString();

    // the next function comes from the argument. that is, go to the next function or thing to run
    next();
  } catch (error) {
    return res.status(401);
  }
};
