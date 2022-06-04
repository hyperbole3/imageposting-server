const jwt = require("jsonwebtoken");

// TODO use database/redis cache
let refreshTokens = [];

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' });
}

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.status(401).end();
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json("token invalid").end();
    req.user = user;
    next();
  });
}

function verifyToken(token, secret, callback) {
  jwt.verify(token, secret, callback);
}

function storeRefreshToken(refreshToken) {
  refreshTokens.push(refreshToken);
}

function includesRefreshToken(refreshToken) {
  return refreshTokens.includes(refreshToken);
}

function deleteRefreshToken(refreshToken) {
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);
}

module.exports = {authenticateToken, verifyToken, generateAccessToken, generateRefreshToken, includesRefreshToken, deleteRefreshToken, storeRefreshToken};