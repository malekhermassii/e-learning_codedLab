const router = require("express").Router();
const passport = require("passport");
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../modeles/userModal'); // adapte le chemin selon ton projet


generateToken = (userId) => {
	// we use the jwt.sign to generate a json web token
	return jwt.sign(
	  { 
		userId: userId, 
	  },
	  process.env.JWT_SECRET,
	  { expiresIn: "1d" }
	)
  };

router.get("/login/success", (req, res) => {
	if (req.user) {
		res.status(200).json({
			error: false,
			message: "Successfully Loged In",
			user: req.user,
		});
	} else {
		res.status(403).json({ error: true, message: "Not Authorized" });
	}
});

router.get("/login/failed", (req, res) => {
	res.status(401).json({
		error: true,
		message: "Log in failure",
	});
});

router.get("/google", passport.authenticate("google", {
	scope: ["profile", "email"]
}));

router.get(
	"/google/callback",
	(req, res, next) => {
		passport.authenticate("google", (err, user, token) => {
			if (err) {
				console.error("Erreur d'authentification Google:", err);
				return res.redirect("/auth/login/failed");
			}
			if (!user) {
				return res.redirect("/auth/login/failed");
			}
			req.logIn(user, (err) => {
				if (err) {
					console.error("Erreur de connexion:", err);
					return res.redirect("/auth/login/failed");
				}
				// Redirection vers le frontend avec les informations utilisateur
				const frontendUrl = "http://localhost:3000";

				const token = generateToken(user._id);
				const userData = {
					userId: user._id,
					name: user.name,
					email: user.email,
					image: user.image,
					dateNaissance: user.dateNaissance,
					telephone: user.telephone,
					token: token
				};
				return res.redirect(`${frontendUrl}/?user=${encodeURIComponent(JSON.stringify(userData))}`);
			});
		})(req, res, next);
	}
);

router.get("/logout", (req, res) => {
	req.logout((err) => {
		if (err) {
			return res.status(500).json({ error: true, message: "Error during logout" });
		}
		res.redirect("http://localhost:3000" || "http://192.168.70.148:3000");
	});
});

// Route pour l'authentification mobile
router.post("/google/mobile", async (req, res) => {
  try {
    const { accessToken } = req.body;
    const client = new OAuth2Client(process.env.CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: accessToken,
      audience: process.env.CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        password: Math.random().toString(36).slice(-8),
        image: payload.picture,
      });
    }

    const token = generateToken(user._id);
    const userData = {
      userId: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      dateNaissance: user.dateNaissance,
      telephone: user.telephone,
      token: token
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error("Erreur d'authentification mobile:", error);
    res.status(500).json({ error: true, message: "Erreur d'authentification" });
  }
});

module.exports = router;