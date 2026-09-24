const jwt = require('jsonwebtoken');


function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];

  if (!header) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  const token = parts[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    req.user = decoded;
    next();
  });
}

module.exports = authMiddleware;
