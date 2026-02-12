import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = req.app.get('users');
  const user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    req.app.get('jwtSecret'),
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, name: user.name } });
});
