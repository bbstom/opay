const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./env');

function signToken(payload, options = { expiresIn: '7d' }) {
  return jwt.sign(payload, getJwtSecret(), options);
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = { signToken, verifyToken, getJwtSecret };
