require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const app = express();
app.use(express.static("public"));

const YOUR_DOMAIN = "http://localhost:4242";

app.post("/create-checkout-session", async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: "Rental Car",
                        description: "Car rental booking payment",
                        images: [
                            "https://res.cloudinary.com/enlearn/image/upload/v1642928006/fullauth/user-pictures/default_rg7jfy.png",
                        ],
                    },
                    unit_amount: 4526 * 100, // 4526 INR
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: `${YOUR_DOMAIN}?success=true`,
        cancel_url: `${YOUR_DOMAIN}?canceled=true`,
    });
    console.log(session.url);
    res.redirect(303, session.url);
});

app.listen(4242, () => console.log("Running on port 4242"));
