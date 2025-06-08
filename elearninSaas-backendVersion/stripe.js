// const Stripe = require("stripe");
// const dotenv = require("dotenv");
// const { Plan } = require("./modeles/AbonnementModal");
// const router = require("express").Router();

// dotenv.config();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// router.post('/create-checkout-session', async (req, res) => {
//   try {
//     const { planId, apprenantId } = req.body;

//     // 1. Validate inputs
//     if (!planId || !apprenantId) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     // 2. Get plan with Stripe IDs
//     const plan = await Plan.findById(planId);
//     if (!plan || !plan.stripePriceId) {
//       return res.status(404).json({ error: 'Plan non trouvé ou mal configuré' });
//     }

//     // 3. Create subscription session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [{
//         price: plan.stripePriceId, // Use pre-configured price
//         quantity: 1,
//       }],
//       mode: "subscription",
//       success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.FRONTEND_URL}/cancel`,
//       subscription_data: {
//         metadata: { // Metadata on subscription object
//           planId: plan._id.toString(),
//           apprenantId: apprenantId,
//         }
//       }
//     });

//     res.json({ id: session.id });

//   } catch (error) {
//     console.error("Checkout error:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// router.get("/session/:session_id", async (req, res) => {
//   try {
//     // Verify session and get subscription details
//     const session = await stripe.checkout.sessions.retrieve(
//       req.params.session_id,
//       { expand: ['subscription'] }
//     );

//     if (!session.subscription) {
//       return res.status(400).json({ error: "No subscription found" });
//     }

//     // Get subscription metadata
//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription.id
//     );

//     res.json({
//       session_id: session.id,
//       status: session.status,
//       subscription_metadata: subscription.metadata
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;