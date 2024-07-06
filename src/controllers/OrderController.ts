import Stripe from "stripe";
import { Request, Response } from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";
import Order from "../models/order";

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string);
const FRONTEND_URL = process.env.FRONTEND_URL as string;
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

type CheckoutSessionRequest = {
  cartItems: {
    menuItemId: string;
    name: string;
    quantity: string;
  }[];
  deliveryDetails: {
    email: string;
    name: string;
    addressLine1: string;
    city: string;
  };
  restaurantId: string;
};

// FOR THE STRIPE WEBHOOK HANDLER
const stripeWebhookHandler = async (req: Request, res: Response) => {
  /*
  console.log("RECEIVED EVENT");
  console.log("================");
  console.log("event: ", req.body);
  // we will say res.send() to acknowledge that we received the webhook event by sending back a positive response so that stripe will know that the event was received successfully and it will update dashboard and other things to reflect that
  res.send();
  */
  let event;
  try {
    // we will get the stripe signature from the webhook headers
    const sig = req.headers["stripe-signature"];
    event = STRIPE.webhooks.constructEvent(
      req.body,
      sig as string,
      STRIPE_ENDPOINT_SECRET
    );
  } catch (error: any) {
    console.log("error ", error);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    // Remember, when we created the stripe checkout session, we attached the order id to that checkout session
    const order = await Order.findById(event.data.object.metadata?.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Here, we will update the order
    order.totalAmount = event.data.object.amount_total;
    order.status = "paid";

    // we will save the order back to the database
    await order.save();
  }

  res.status(200).send();
};

const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const checkoutSessionRequest: CheckoutSessionRequest = req.body;

    // find the restaurant we want to buy /order from base on the restaurant id
    const restaurant = await Restaurant.findById(
      checkoutSessionRequest.restaurantId
    );

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // HERE, we will insert the order the user made into the order table/document
    const newOrder = new Order({
      restaurant: restaurant,
      user: req.userId,
      status: "placed",
      deliveryDetails: checkoutSessionRequest.deliveryDetails,
      cartItems: checkoutSessionRequest.cartItems,
      createdAt: new Date()
    });

    // we will create all the items we want to display on the checkout page which is all the items added to cart
    const lineItems = createLineItems(
      checkoutSessionRequest,
      restaurant.menuItems
    );

    // after creating the line item, we will send it to stripe. this is an async function we created below
    // even though we have not saved the order to database before we can access the order _id, mongoose has created an id we can use
    const session = await createSession(
      lineItems,
      newOrder._id.toString(),
      restaurant.deliveryPrice,
      restaurant._id.toString()
    );

    // session.url is the url of the hosted page on stripe. it is important we have it . it is the url in which stripe will display all our line items and other information before we click pay on stripe and enter our bank details. if we don't get this url. it is more likely that something is wrong with the createLineItems() function or createSession() function
    if (!session.url) {
      return res.status(500).json({ message: "Error creating stripe session" });
    }

    // we will save the new Order to order table/ database Here
    await newOrder.save();

    // we will return the url to take us to the stripe page to display our cart items and also enter our payment details
    res.json({ url: session.url });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.raw.message });
  }
};

// the reason we need to parse the menuItem is becase the checkout cartItem does not have price, we need to get the price of each items base on the menu cartItem id. the reason we are not parsing the price from the frontend
const createLineItems = (
  checkoutSessionRequest: CheckoutSessionRequest,
  menuItems: MenuItemType[]
) => {
  // 1. we need to get the menu item from the restaurant we are ordering from. we will get the price for the cartItem from the menuItems in the restaurant
  // 2. we will convert it to stripe line item
  // 3. we will return the line item array
  const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
    const menuItem = menuItems.find(
      (item) => item._id.toString() === cartItem.menuItemId.toString()
    );

    if (!menuItem) {
      throw new Error(`Menu item not found: ${cartItem.menuItemId}`);
    }

    // This is from stripe. we will fill tje price, name and quantity for each of the cart item
    const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: "usd",
        unit_amount: menuItem.price,
        product_data: {
          name: menuItem.name
        }
      },
      quantity: parseInt(cartItem.quantity)
    };

    return line_item;
  });

  return lineItems;
};

const createSession = async (
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  orderId: string,
  deliveryPrice: number,
  restaurantId: string
) => {
  const sessionData = await STRIPE.checkout.sessions.create({
    line_items: lineItems,
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery",
          type: "fixed_amount",
          fixed_amount: {
            amount: deliveryPrice,
            currency: "usd"
          }
        }
      }
    ],
    mode: "payment",
    //in meta data, we store any additional information we want that will help us in debugging
    metadata: {
      orderId,
      restaurantId
    },
    success_url: `${FRONTEND_URL}/order-status?success=true`,
    cancel_url: `${FRONTEND_URL}/detail/${restaurantId}?cancelled=true`
  });

  return sessionData;
};

export default {
  createCheckoutSession,
  stripeWebhookHandler
};
