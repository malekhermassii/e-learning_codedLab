const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  offers: { type: String },
  duration: { type: Number, required: true }, 
  interval: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },
  stripeProductId: String,    // Required for Stripe integration
  stripePriceId: String       // Required for Stripe integration
});

const AbonnementSchema = new mongoose.Schema({
  apprenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Apprenant" },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  dateDebut: { type: Date, default: Date.now },
  dateFin: { type: Date },
  statut: { 
    type: String, 
    enum: ["actif", "en_retard", "annulé", "expiré", "suspendu"],
    default: "actif"
  },
  stripeSubscriptionId: { type: String}, // Important index
  payments: [{
    date: Date,
    amount: Number,
    invoiceId: { type: String, index: true } // Index for payment queries
  }]
});

const paiementSchema = new mongoose.Schema({
  abonnement_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Abonnement', 
    required: true,
    index: true // Important for joining data
  },
  montant: { type: Number, required: true },
  methodePaiement: {
    type: String,
    required: true,
    enum: ['carte', 'virement', 'autre']
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true // Prevents duplicate payment processing
  },
  factureStripeId: {
    type: String,
    // unique: true, Critical for webhook idempotency
    required: true
  },
  statut: { 
    type: String, 
    enum: ['réussi', 'échoué', 'en_attente'],
    default: 'en_attente'
  }
}, { timestamps: true });

// Add indexes
PlanSchema.index({ stripePriceId: 1 });                 // Faster plan lookups
AbonnementSchema.index({ stripeSubscriptionId: 1 });     // Faster subscription queries
AbonnementSchema.index({ apprenant_id: 1 });      // User subscription history
paiementSchema.index({ factureStripeId: 1 }, { unique: true }); // Webhook safety

const Plan = mongoose.model("Plan", PlanSchema);
const Abonnement = mongoose.model("Abonnement", AbonnementSchema);
const Payment = mongoose.model('Paiement', paiementSchema);

module.exports = { Plan, Abonnement, Payment };