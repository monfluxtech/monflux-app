import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const contacts = await dbAll(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    const contactId = uuidv4();
    
    await dbRun(
      'INSERT INTO contacts (id, user_id, name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [contactId, req.user.userId, name, email, phone, address, notes]
    );
    
    res.json({ contactId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:contactId', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, notes, lastContacted } = req.body;
    
    await dbRun(
      'UPDATE contacts SET name = ?, email = ?, phone = ?, address = ?, notes = ?, last_contacted = ? WHERE id = ? AND user_id = ?',
      [name, email, phone, address, notes, lastContacted, req.params.contactId, req.user.userId]
    );
    
    res.json({ message: 'Contact mis à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:contactId', authenticateToken, async (req, res) => {
  try {
    await dbRun(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [req.params.contactId, req.user.userId]
    );
    res.json({ message: 'Contact supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
