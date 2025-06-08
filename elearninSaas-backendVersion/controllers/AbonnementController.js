const { Abonnement, Plan, Payment } = require("../modeles/AbonnementModal");
const Apprenant = require("../modeles/ApprenantModal");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const  User  = require("../modeles/userModal");
const mongoose = require('mongoose');
const { translateText } = require('../utils/translation');

const stripeToStatut = {
  active:     "actif",
  // past_due:   "en_retard",
  canceled:   "annulé",
  unpaid:     "en_retard",
  incomplete: "en_attente",
  paused:     "suspendu",
};
//exports.createPlan = async (req, res) => {
 // try {
  //  const { name, price, interval, offers } = req.body;

 //   if (!name || price == null || !interval || !offers) {
 //     return res.status(400).json({ message: "Tous les champs sont requis" });
 //   }

 //   const existingPlan = await Plan.findOne({ name });
 //   if (existingPlan) {
 //     return res.status(409).json({ message: "Ce nom de plan existe déjà" });
 //   }

 //     const newPlan = new Plan({ name, price, interval, offers });
 //   await newPlan.save();

    // Création du produit Stripe
  //  const stripeProduct = await stripe.products.create({
  //    name: newPlan.name,
  //    metadata: { planId: newPlan._id.toString() },
  //  });

    // Création du prix Stripe
  //  const stripePrice = await stripe.prices.create({
  //    product: stripeProduct.id,
  //    unit_amount: newPlan.price * 100,
  //    currency: "usd",
  //    recurring: { interval: "month" }, // Adaptez selon la durée
  //  });

  //  newPlan.stripePriceId = stripePrice.id;
  //  await newPlan.save();

  //  res.status(201).json({ message: "Plan créé avec succès", plan: newPlan });
  // } catch (error) {
  //   res.status(500).json({ message: "Erreur serveur", error: error.message });
  // }
//};


exports.createPlan = async (req, res) => {
  try {
    const { name, price, duration, offers, interval } = req.body; // Ensure interval is included

    // Validate inputs (add interval check if required)
    if (!name || price == null || !duration || !offers || !interval) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const newPlan = new Plan({ name, price, duration, offers, interval });

    // Create Stripe product and price with interval and duration
    const stripeProduct = await stripe.products.create({
      name: newPlan.name,
      metadata: { planId: newPlan._id.toString() },
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: newPlan.price * 100,
      currency: "usd",
      recurring: {
        interval: newPlan.interval, // Use plan's interval (month/year)
        interval_count: newPlan.duration, // Use plan's duration (number)
      },
    });

    newPlan.stripeProductId = stripeProduct.id;
    newPlan.stripePriceId = stripePrice.id;
    await newPlan.save();

    res.status(201).json({ message: "Plan créé avec succès", plan: newPlan });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


//update plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan non trouvé" });
    }

    const updatedPlan = await Plan.findByIdAndUpdate(planId, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Plan mis à jour",
      plan: updatedPlan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
//delete
exports.deletePlan = (req, res) => {
  Plan.findByIdAndDelete(req.params.planId)
    .then((plan) => {
      if (!plan) {
        return res.status(404).send({
          message: "plan not fount with the id " + req.params.planId,
        });
      }
      res.send({ message: "plan deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the plan by id" + req.params.planId,
      });
    });
};
//Consulter all plan
exports.findAllplans = async (req, res) => {
  try {
    const plans = await Plan.find();
    
    // Ajouter les traductions pour chaque plan
    const plansWithTranslation = await Promise.all(
      plans.map(async (plan) => {
        const planObj = plan.toObject();
        
        // Traduire le nom du plan
        if (planObj.name) {
          try {
            planObj.name_ar = await translateText(planObj.name, 'en', 'ar');
          } catch (error) {
            console.error("Error translating plan name:", error);
            planObj.name_ar = planObj.name;
          }
        }
        
        // Traduire les offres du plan
        if (planObj.interval) {
          try {
            planObj.interval_ar = await translateText(planObj.interval, 'en', 'ar');
          } catch (error) {
            console.error("Error translating plan interval:", error);
            planObj.interval_ar = planObj.interval;
          }
        }
        
        return planObj;
      })
    );

    res.send(plansWithTranslation);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur serveur lors de la récupération des plans",
    });
  }
};
//consulter un plan
exports.findOneplan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).send({
        message: "Plan non trouvé avec l'id " + req.params.planId,
      });
    }

    const planObj = plan.toObject();
    
    // Traduire le nom du plan
    if (planObj.name) {
      try {
        planObj.name_ar = await translateText(planObj.name, 'en', 'ar');
      } catch (error) {
        console.error("Error translating plan name:", error);
        planObj.name_ar = planObj.name;
      }
    }
    
    // Traduire les offres du plan
    if (planObj.interval) {
      try {
        planObj.interval_ar = await translateText(planObj.interval, 'en', 'ar');
      } catch (error) {
        console.error("Error translating plan interval:", error);
        planObj.interval_ar = planObj.interval;
      }
    }

    // Traduire l'intervalle du plan
    if (planObj.interval) {
      try {
        planObj.interval_ar = await translateText(planObj.interval, 'en', 'ar');
      } catch (error) {
        console.error("Error translating plan interval:", error);
        planObj.interval_ar = planObj.interval;
      }
    }

    res.send(planObj);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Erreur serveur lors de la récupération du plan",
    });
  }
};
// Créer une session de paiement Stripe
exports.createCheckoutSession = async (req, res) => {
  try {
    console.log('Début de createCheckoutSession');
    console.log('User ID:', req.user?.userId);
    console.log('Plan ID:', req.body?.planId);

    const { planId } = req.body;
    const apprenantId = req.user.userId;

    if (!planId) {
      console.error('Plan ID manquant dans la requête');
      return res.status(400).json({ error: "Plan ID est requis" });
    }

    if (!apprenantId) {
      console.error('Apprenant ID manquant dans la requête');
      return res.status(401).json({ error: "Non autorisé" });
    }

    // Convert to strings explicitly
    const stringPlanId = planId.toString();
    const stringApprenantId = apprenantId.toString();

    console.log('Recherche du plan avec ID:', stringPlanId);
    const plan = await Plan.findById(stringPlanId);
    
    if (!plan) {
      console.error('Plan non trouvé');
      return res.status(404).json({ error: "Plan non trouvé" });
    }

    if (!plan.stripePriceId) {
      console.error('Plan non configuré avec Stripe');
      return res.status(400).json({ error: "Plan non configuré correctement avec Stripe" });
    }

    const isMobile = req.headers['x-platform'] === 'mobile';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const successUrl = isMobile
      ? 'https://success.stripe.mobile'
      : `${frontendUrl}/?payment=success`;
    const cancelUrl = isMobile
      ? 'https://cancel.stripe.mobile'
      : `${frontendUrl}/?payment=failed`;

    console.log('Création de la session Stripe');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price: plan.stripePriceId,
        quantity: 1,
      }],
      mode: "subscription",
      subscription_data: {
        metadata: {
          planId: stringPlanId,
          apprenantId: stringApprenantId
        }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: stringApprenantId,
      expand: ['subscription']
    });

    console.log('Session créée avec succès:', session.id);
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe:", error);
    res.status(500).json({ error: error.message });
  }
};
// Webhook Handler
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  const rawBody = req.body; 

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleSubscriptionCreation(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSuccess(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionCancellation(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    res.status(500).json({ error: err.message });
  }
};
async function handleSubscriptionCreation(session) {
  if (!session.subscription) {
    console.error("❌ No subscription found in checkout session");
    return;
  }

  try {
    // 1. Retrieve the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log("Subscription Metadata:", subscription.metadata);

    const userId = subscription.metadata.apprenantId;
    const planId = subscription.metadata.planId;
    if (!userId || !planId) throw new Error("Missing metadata");

    // 2. Load your User and Plan from Mongo (no session)
    const [user, plan] = await Promise.all([
      User.findById(userId),
      Plan.findById(planId),
    ]);
    if (!user) throw new Error("User not found");
    if (!plan) throw new Error("Plan not found");

    // 3. Check for existing active abonnement
    const existing = await Abonnement.findOne({
      apprenant_id: user._id,
      statut: "actif",
    });
    if (existing) {
      console.log("User already has an active subscription");
      
      return;

    }
    const rawStatus = subscription.status;                     
    const statut   = stripeToStatut[rawStatus] || rawStatus;   
    
    // 4. Create the subscription record
    const abonnement = new Abonnement({
      planId: plan._id,
      stripeSubscriptionId: subscription.id,
      statut  ,
      dateDebut:   new Date(subscription.current_period_start * 1000),
      dateFin:     new Date(subscription.current_period_end   * 1000),
    });

    // 5. Create the Apprenant profile for that user
    const existingApprenant = await Apprenant.findOne({ userId: user._id });
    if (existingApprenant) {
      console.log("Apprenant déjà existant");
     existingApprenant.abonnement_id = abonnement._id;
     await abonnement.save();
     await existingApprenant.save();
      return;
    }
    const apprenant = new Apprenant({
      userId: user._id,
      abonnement_id: abonnement._id,
      email: user.email, 
    });

    // 6. Save both documents (no session)
    await Promise.all([
      apprenant.save(),
      abonnement.save(),
    ]);

    console.log("✅ Subscription and Apprenant profile created successfully");

  } catch (err) {
    console.error("❌ Failed to create subscription:", err);
    throw err;
  }
}

async function handlePaymentSuccess(invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const amount = invoice.amount_paid / 100;

    const abonnement = await Abonnement.findOne({
      stripeSubscriptionId: subscription.id,
    });
    if (!abonnement) throw new Error("Abonnement introuvable");

    
    const rawStatus = subscription.status;
    abonnement.statut = stripeToStatut[rawStatus] || abonnement.statut;
    abonnement.dateFin = new Date(subscription.current_period_end * 1000);
    abonnement.payments.push({
      date: new Date(invoice.created * 1000),
      amount,
      invoiceId: invoice.id,
    });
    await abonnement.save();

    // Create a Payment document
    const payment = new Payment({
      abonnement_id: abonnement._id,
      montant: amount,
      methodePaiement: invoice.payment_method_types?.[0] || 'carte',
      stripePaymentIntentId: invoice.payment_intent,
      statut: 'réussi',
      factureStripeId: invoice.id,
    });
    console.log("Invoice object:", invoice);

    await payment.save();

    console.log("✅ Paiement traité:", payment._id);

  } catch (error) {
    console.error("❌ Erreur paiement:", error.message);
    throw error;
  }
}

async function handleSubscriptionCancellation(subscription) {
  await Abonnement.updateOne(
    { stripeSubscriptionId: subscription.id },
    {
      statut: "annulé",
      dateFin: new Date(subscription.current_period_end * 1000),
    }
  );
}

// Gestion des abonnements (Admin)
exports.getSubscriptions = async (req, res) => {
  try {
    const { statut } = req.query;
    const filter = statut ? { statut } : {};

    const apprenants = await Apprenant.find() 
    .populate({
      path: "userId",
      select: "name email dateNaissance telephone"
    })
    .populate({
      path: "abonnement_id",
      populate: {
        path: "planId",
        select: "name price interval offers"
      }
    }).sort({ dateDebut: -1 });

    // const abonnements = await Abonnement.find()
    // .populate("planId", "name price interval offers")
    // .populate({
    //   path: "apprenant_id",
    //   populate: {
    //     path: "userId",
    //     select: "name email dateNaissance telephone"
    //   }
    // })
    
    //   .sort({ dateDebut: -1 });

    res.json(apprenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Historique des paiements (Admin)
exports.getPaymentHistory = async (req, res) => {
  try {
    const paiements = await Payment.find()
    .populate({
      path: "abonnement_id",
        select: "statut _id",
      populate: [
        {
          path: "planId",
          select: "name"
        },
      ]
    })
    .sort({ createdAt: -1 });
    const paiementsWithUser = await Promise.all(paiements.map(async (p) => {
    
      const apprenant = await Apprenant.findOne({abonnement_id: p.abonnement_id._id});
      const user = await User.findById({_id: apprenant.userId});
      return {
        ...p.toObject(),
        user,
      };
    }));

     res.json(paiementsWithUser);
     
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fonction pour configurer un plan existant avec Stripe
exports.configurePlanWithStripe = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({ error: "Plan non trouvé" });
    }

    // Création du produit Stripe
    const stripeProduct = await stripe.products.create({
      name: plan.name,
      metadata: { planId: plan._id.toString() },
    });

    // Création du prix Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: plan.price * 100, // Convertir en centimes
      currency: "usd",
      recurring: { 
        interval: plan.interval || "month"
      },
    });

    // Mise à jour du plan avec les IDs Stripe
    plan.stripeProductId = stripeProduct.id;
    plan.stripePriceId = stripePrice.id;
    await plan.save();

    res.json({ 
      message: "Plan configuré avec succès",
      plan: {
        ...plan.toObject(),
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id
      }
    });
  } catch (error) {
    console.error("Erreur lors de la configuration du plan avec Stripe:", error);
    res.status(500).json({ error: error.message });
  }
};

// Créer un PaymentIntent pour le paiement mobile
exports.createPaymentIntent = async (req, res) => {
  try {
    console.log('Début de createPaymentIntent');
    console.log('User ID:', req.user?.userId);
    console.log('Plan ID:', req.body?.planId);

    const { planId } = req.body;
    const apprenantId = req.user.userId;

    if (!planId) {
      console.error('Plan ID manquant dans la requête');
      return res.status(400).json({ error: "Plan ID est requis" });
    }

    if (!apprenantId) {
      console.error('Apprenant ID manquant dans la requête');
      return res.status(401).json({ error: "Non autorisé" });
    }

    // Convert to strings explicitly
    const stringPlanId = planId.toString();
    const stringApprenantId = apprenantId.toString();

    console.log('Recherche du plan avec ID:', stringPlanId);
    const plan = await Plan.findById(stringPlanId);
    
    if (!plan) {
      console.error('Plan non trouvé');
      return res.status(404).json({ error: "Plan non trouvé" });
    }

    if (!plan.stripePriceId) {
      console.error('Plan non configuré avec Stripe');
      return res.status(400).json({ error: "Plan non configuré correctement avec Stripe" });
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100, // Montant en centimes
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        planId: stringPlanId,
        apprenantId: stringApprenantId
      }
    });

    console.log('PaymentIntent créé avec succès:', paymentIntent.id);
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error("Erreur lors de la création du PaymentIntent:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.getAbonnement = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (
      !mongoose.Types.ObjectId.isValid(userId) 
    ) {
      return res.status(400).json({
        message: "Invalid user ID ",
        details: {
          userIdValid: mongoose.Types.ObjectId.isValid(userId),
         
        },
      });
    }

    const apprenant = await Apprenant.findOne({ userId });
    if (!apprenant) {
      return res.status(404).json({ error: "Apprenant non trouvé" });
    }

    const abonnement = await Abonnement.findOne({_id: apprenant.abonnement_id })
    .populate("planId", "name price interval offers");
    if (!abonnement) {
      return res.status(404).json({ error: "Abonnement non trouvé" });
    }

    res.json({abonnement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
