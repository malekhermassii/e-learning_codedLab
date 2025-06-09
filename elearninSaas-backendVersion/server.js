require("dotenv").config();
const express = require("express"); //gérer les requêtes HTTP
const helmet = require("helmet"); 
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const uploads = require("./uploads");
const passport = require("passport");
const passportStrategy = require("./passport");
const authRoute = require("./routes/auth");

app.use(helmet());

const { sendPushNotification, sendPushNotificationToMultipleUsers } = require("./Notification/NotificationService");

const abonnement = require("./controllers/AbonnementController");
//socket.io
const http = require("http"); //créer un serveur HTTP sur lequel Socket.IO va fonctionner.
const socketIo = require("socket.io"); //Gérer la communication en temps réel
const server = http.createServer(app); // Créer un serveur HTTP
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:4000", "http://192.168.70.148:4000", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 24000
});
app.set('socketio', io);
// Attacher Socket.IO au serveur
const bodyParser = require("body-parser");
const port =4000;
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }), // <-- Raw body parser
  abonnement.handleWebhook
);
// Middleware 



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
// Middleware général (NE PAS inclure express.json ici)
app.use(express.urlencoded({ extended: true }));

// Middleware pour Stripe Webhooks (doit être AVANT `express.json()`)
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

// Webhook route uses raw body parser
app.use(express.json());
// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

app.use(
  session({
    // Secret used to sign session IDs (either from environment variable or fallback value)
    secret: process.env.SESSION_SECRET,
    // Prevents the session from being saved back to the session store if nothing has changed
    resave: false,
    // Prevents saving a session that has not been modified
    saveUninitialized: false,
    cookie: {
      // Ensures the cookie is only sent over HTTPS in production
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // Sets the session cookie's expiration time to 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Endpoint API pour envoyer des notifications push
app.post("/sendNotificationpush", async (req, res) => {
  const { token, title, message, data } = req.body;

  // Vérification que les paramètres sont fournis
  if (!token || !title || !message) {
    return res
      .status(400)
      .json({ error: "Token, titre et message sont requis" });
  }

  try {
    // Appel au service pour envoyer la notification
    const result = await sendPushNotification(token, title, message, data);
    
    if (result.success) {
      res.status(200).json({ 
        message: "Notification envoyée avec succès", 
        tickets: result.tickets 
      });
    } else {
      res.status(400).json({ 
        error: "Erreur lors de l'envoi de la notification", 
        details: result.error 
      });
    }
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ 
      error: "Erreur serveur lors de l'envoi de la notification",
      details: error.message 
    });
  }
});

// Endpoint pour envoyer des notifications à plusieurs utilisateurs
app.post("/sendNotificationpushMultiple", async (req, res) => {
  const { tokens, title, message, data } = req.body;

  // Vérification que les paramètres sont fournis
  if (!tokens || !Array.isArray(tokens) || !title || !message) {
    return res
      .status(400)
      .json({ error: "Tokens (tableau), titre et message sont requis" });
  }

  try {
    // Appel au service pour envoyer les notifications
    const result = await sendPushNotificationToMultipleUsers(tokens, title, message, data);
    
    if (result.success) {
      res.status(200).json({ 
        message: "Notifications envoyées avec succès", 
        tickets: result.tickets 
      });
    } else {
      res.status(400).json({ 
        error: "Erreur lors de l'envoi des notifications", 
        details: result.error 
      });
    }
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ 
      error: "Erreur serveur lors de l'envoi des notifications",
      details: error.message 
    });
  }
});

//notification socket.io
app.post("/send-notification", (req, res) => {
  const { message } = req.body;
  // Vérification de la présence du message
  if (!message) {
    return res.status(400).json({ error: "Message est requis" });
  }
  // envoie l'événement de notification à tous les clients connectés
  io.emit("notification", { message });
  res.status(200).json({ message: "Notification envoyée à tous les clients par le serveur" });
});

// Middleware pour les connexions Socket.IO
io.use((socket, next) => {
  console.log("Nouvelle tentative de connexion Socket.IO");
  next();
});

// Écoute des connexions des clients via WebSocket
io.on("connection", (socket) => {
  console.log("Un client est connecté - ID:", socket.id);
  console.log("Nombre total de clients connectés:", io.engine.clientsCount);

  // Écouter l'événement de connexion du professeur
  socket.on("professeurConnect", (professeurId) => {
    console.log(`Professeur ${professeurId} connecté`);
    socket.join(`professeur_${professeurId}`);
  });

  // Écouter l'événement de connexion de l'apprenant
  socket.on("apprenantConnect", (apprenantId) => {
    console.log(`Apprenant ${apprenantId} connecté - Socket ID: ${socket.id}`);
    socket.join(`apprenant_${apprenantId}`);
    console.log(`Socket ${socket.id} a rejoint la room apprenant_${apprenantId}`);
    
    // Vérifier les rooms actives
    console.log("Rooms actives:", socket.rooms);
  });

  // Écouter un événement personnalisé 'message' par le client
  socket.on("message", (data) => {
    console.log("Message reçu de", socket.id, ":", data);
    socket.emit("response", { message: `Message bien reçu: ${data.message}` });
  });

  // Gérer la déconnexion du client
  socket.on("disconnect", () => {
    console.log("Client déconnecté - ID:", socket.id);
  });

  // Gérer les erreurs
  socket.on("error", (error) => {
    console.error("Erreur Socket.IO:", error);
  });
});




// Rendre les fichiers accessibles
app.use("/Public/Images", express.static("Public/Images", {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
  }
}));

app.use("/Public/Videos", express.static("Public/Videos", {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
  }
}));

app.use("/Public/CV", express.static("Public/CV", {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
  }
}));

// Connect to MongoDB
// mongodb+srv://maleekhermassii:mcsxTp9Svo5zrtUU@cluster0.ie2ke8k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
mongoose
  .connect("mongodb+srv://maleekhermassii:mcsxTp9Svo5zrtUU@cluster0.ie2ke8k.mongodb.net/lms?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error while connecting to DB:", error);
  });
// Routes
app.get("/", (req, res) => {
  res.send("Hello, this is our first app");
});
//upload image et vd
app.post(
  "/upload",
  uploads.fields([{ name: "image" }, { name: "url" }, { name: "cv" }]),
  (req, res) => {
    try {
      if (!req.files) {
        return res.status(400).json({ message: "Aucun fichier sélectionné" });
      }

      const imagePath = req.files["image"]
        ? req.files["image"][0].filename
        : null;
      const videoPaths = req.files["url"]
        ? req.files["url"].map((file) => file.filename)
        : [];
      const cvPath = req.files["cv"] ? req.files["cv"][0].filename : null;

      res.json({
        message: "Fichiers uploadés avec succès",
        image: imagePath,
        videos: videoPaths,
        cv: cvPath,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Import routes
require("./routes/userRoute")(app);
require("./routes/ProfesseurRoute")(app);
require("./routes/CategorieRoute")(app);
require("./routes/ApprenantRoute")(app);
require("./routes/CoursRoute")(app);
require("./routes/QuizRoute")(app);
require("./routes/QuestionRoute")(app);
require("./routes/FeedbackRoute")(app);
require("./routes/CertificatRoute")(app);
require("./routes/AbonnementRoute")(app);
require("./routes/DemandeRoute")(app);
require("./routes/AdminRoute")(app);
require("./routes/userRoute")(app);
app.use("/auth", authRoute);

// Start server
server.listen(port, () => {
  console.log(`Our app is working on port ${port}`);
});