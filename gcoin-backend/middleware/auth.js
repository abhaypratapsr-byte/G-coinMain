const dotenv = require('dotenv');
dotenv.config();

const adminAuth = (req, res, next) => {
  try {

    // ✅ Allow preflight requests
if (req.method === 'OPTIONS') {
  return next();
}

    const adminKey =
  req.headers['x-admin-key'] ||
  (req.headers['authorization']?.startsWith('Bearer ')
    ? req.headers['authorization'].split(' ')[1]
    : undefined); 
    if (!adminKey) {
      return res.status(401).json({
        success: false,
        message: 'Admin key required'
      });
    }

    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin key'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = { adminAuth };