module.exports = (app) => {
  const abonnement = require("../controllers/AbonnementController");
  const authMiddleware = require('../middleware/authMiddleware');
  app.post("/checkoutsession",authMiddleware ,abonnement.createCheckoutSession);
  app.post("/webhook", abonnement.handleWebhook);
  app.get("/plans", abonnement.findAllplans);
  app.get("/admin/subscriptions",authMiddleware, abonnement.getSubscriptions);
  app.get("/admin/payments", authMiddleware, abonnement.getPaymentHistory);
  // gere plan
  app.post("/planabonnement", authMiddleware, abonnement.createPlan);
  app.put("/planabonnement/:planId", authMiddleware, abonnement.updatePlan);
  app.delete("/planabonnement/:planId", authMiddleware, abonnement.deletePlan);
  app.get("/planabonnement", abonnement.findAllplans);
  app.get("/planabonnement/:planId", abonnement.findOneplan);
  // Configuration Stripe pour un plan existant
  app.post("/planabonnement/:planId/configure-stripe", authMiddleware, abonnement.configurePlanWithStripe);
  app.post("/createpaymentintent", authMiddleware, abonnement.createPaymentIntent);
  app.get("/abonnement", authMiddleware, abonnement.getAbonnement);
};
