import Stripe from "stripe";
import EasyPost from "@easypost/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Store this in AWS Lambda environment variables
const easypost = new EasyPost(process.env.EASYPOST_API_KEY); // Store this in AWS Lambda environment variables

export const handler = async (event) => {
  console.log('event', event);
  console.log('event.body', event.body);
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  try {
    const { items, shipping } = JSON.parse(event.body);

    const line_items = items.map((item) => {
      const obj = {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.productName,
            description: item.description, // optional
            images: [item.imageUrl] // optional
          },
          unit_amount: Math.round(item.price * 100), // Stripe expects cents
        },
        quantity: item.quantity,
      }
      if (!item.imageUrl || !item.imageUrl.startsWith("https://")) {
        delete obj.price_data.product_data.images;
      }
      return obj;
    });

    // Estimate shipping using EasyPost
    const toAddress = await easypost.Address.create({
      name: shipping.name,
      street1: shipping.address,
      city: shipping.city,
      state: shipping.state,
      zip: shipping.zip,
      country: "US",
    });

    const fromAddress = await easypost.Address.create({
      name: "Bernardo Mondragon",
      street1: "716 Fishburn Rd",
      city: "Hershey",
      state: "PA",
      zip: "17033",
      country: "US",
    });

    const parcel = await easypost.Parcel.create({
      length: 4,     // in inches
      width: 4,
      height: 2,
      weight: 4,     // in ounces, typical for a ring + box + padding
    });

    const shipment = await easypost.Shipment.create({
      to_address: toAddress,
      from_address: fromAddress,
      parcel,
    });

    const rate = shipment.lowestRate(["USPS", "UPS"], ["Priority", "Ground"]);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'] // Use ISO 2-letter country code
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(parseFloat(rate.rate) * 100),
              currency: "usd",
            },
            display_name: `${rate.carrier} ${rate.service}`,
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ],
      line_items,
      success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}", // TODO: Change to "https://yourdomain.com/success"
      cancel_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}", // TODO: Change to "https://yourdomain.com/cancel"
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // or your specific origin
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (err) {
    console.error("Stripe error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create checkout session" }),
    };
  }
};
