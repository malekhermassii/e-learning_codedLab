const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("./modeles/userModal");
const Apprenant = require("./modeles/ApprenantModal");

// Stratégie pour le web
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "https://backendlms-5992.onrender.comauth/google/callback",
			scope: ["profile", "email"],
		},
		async function (accessToken, refreshToken, profile, callback) {
			try {
				// Vérifier si l'utilisateur existe déjà
				let user = await User.findOne({ email: profile.emails[0].value });

				if (!user) {
					// Créer un nouvel utilisateur
					user = await User.create({
						name: profile.displayName,
						email: profile.emails[0].value,
						password: Math.random().toString(36).slice(-8), // Mot de passe aléatoire
						image: profile.photos[0].value,
					});
				}

				return callback(null, user);
			} catch (error) {
				console.error("Erreur lors de l'authentification Google:", error);
				return callback(error, null);
			}
		}
	)
);

// Stratégie pour l'application mobile
passport.use(
	'mobile-google',
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "https://auth.expo.io/@rihabchebil/elearningMobile",
			scope: ["profile", "email"],
		},
		async function (accessToken, refreshToken, profile, callback) {
			try {
				let user = await User.findOne({ email: profile.emails[0].value });

				if (!user) {
					user = await User.create({
						name: profile.displayName,
						email: profile.emails[0].value,
						password: Math.random().toString(36).slice(-8),
						image: profile.photos[0].value,
					});
				}

				return callback(null, user);
			} catch (error) {
				console.error("Erreur lors de l'authentification Google mobile:", error);
				return callback(error, null);
			}
		}
	)
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

module.exports = passport;
