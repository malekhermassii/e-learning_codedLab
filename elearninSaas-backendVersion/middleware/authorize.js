// Returns a middleware function that checks if user's role is in allowedRoles
// ...allowedRoles (admin , professor , student)
module.exports = (...allowedRoles) => {
    // Return the actual middleware function that will be used in routes
    return (req, res, next) => {
      // Check two conditions:
      // 1. If user is not authenticated (req.user doesn't exist)
      // 2. If user's role is NOT in the allowedRoles list
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        // If either condition fails, send 403 Forbidden response
        return res.status(403).json({
          success: false,
          message: "Accès refusé: Autorisation insuffisante" 
        });
      }
      
      // If authorization check passes, continue to next middleware
      next();
    };
  };