import express from "express";
import MyUserController from "../controllers/MyUserController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyUserRequest } from "../middleware/validation";

const router = express.Router();

// /api/my/user
router.get("/", jwtCheck, jwtParse, MyUserController.getCurrentUser);

// the jwtCheck will check the autorization token in the header. this function is from auth0.com application >> api section
router.post("/", jwtCheck, MyUserController.createCurrentUser);

// jwtCheck checks if the access token is correct from auth0 and jwtParse cehcks if the bearer token can be access..
router.put(
  "/",
  jwtCheck,
  jwtParse,
  validateMyUserRequest,
  MyUserController.updateCurrentUser
);

export default router;
