import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }
  try {
    const decoded = jwt.verify(token, req.app.get('jwtSecret'));
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
}
