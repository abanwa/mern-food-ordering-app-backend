import express from "express";
import { jwtCheck, jwtParse } from "../middleware/auth";
import OrderController from "../controllers/OrderController";

const router = express.Router();



// THIS WILL GET THE ORDERS OF THE LOGGED IN USER
router.get("/", jwtCheck, jwtParse, OrderController.getMyOrder);

router.post(
  "/checkout/create-checkout-session",
  jwtCheck,
  jwtParse,
  OrderController.createCheckoutSession
);

// FOR OUR WEBHOOK
router.post("/checkout/webhook", OrderController.stripeWebhookHandler);

export default router;
