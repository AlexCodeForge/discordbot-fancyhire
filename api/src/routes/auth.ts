import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/Logger';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD || '';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    if (username !== ADMIN_USERNAME) {
      Logger.warning('Intento de login con usuario inválido', { username }, req);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!isValid) {
      Logger.warning('Intento de login con contraseña incorrecta', { username }, req);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

    Logger.info('Login exitoso', { username }, req);

    res.json({
      token,
      username,
      expiresIn: '7d'
    });
  } catch (error) {
    Logger.error('Error en login', { username: req.body?.username }, error as Error, req);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ valid: false });
    }

    jwt.verify(token, JWT_SECRET);
    res.json({ valid: true });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

export default router;
