const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      req.user = { userId: req.session.userId };
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Authentication required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalise le champ userId pour tous les cas
    req.user = {
      userId: decoded.userId || decoded.id || decoded._id
    };
    next();
  } catch (error) {
    res.status(401).json({ message: error.message || 'Authentication failed' });
  }
};