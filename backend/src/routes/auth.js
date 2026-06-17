import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet } from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et password requis' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    await dbRun(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, email, hashedPassword]
    );
    
    const token = generateToken(userId, email);
    res.json({ userId, email, token });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email déjà utilisé' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Email ou mot de passe invalide' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Email ou mot de passe invalide' });
    }
    
    const token = generateToken(user.id, user.email);
    res.json({ userId: user.id, email: user.email, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/onboarding', authenticateToken, async (req, res) => {
  try {
    const { companyName, rbqNumber, usagePreference, teamSize, sector } = req.body;
    
    await dbRun(
      'UPDATE users SET company_name = ?, rbq_number = ?, usage_preference = ?, team_size = ?, sector = ? WHERE id = ?',
      [companyName, rbqNumber, usagePreference, teamSize, sector, req.user.userId]
    );
    
    // Create sample project
    const projectId = uuidv4();
    await dbRun(
      'INSERT INTO projects (id, user_id, name, type, status, budget) VALUES (?, ?, ?, ?, ?, ?)',
      [projectId, req.user.userId, 'Projet Sample', sector || 'Général', 'active', 5000]
    );
    
    res.json({ message: 'Onboarding complété', projectId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, email, company_name, rbq_number, usage_preference, team_size, sector FROM users WHERE id = ?', [req.user.userId]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
