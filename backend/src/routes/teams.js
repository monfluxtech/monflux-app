import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbAll } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:projectId/members', authenticateToken, async (req, res) => {
  try {
    const members = await dbAll(
      'SELECT id, name, email, role, joined_at FROM team_members WHERE project_id = ?',
      [req.params.projectId]
    );
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:projectId/members', authenticateToken, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const memberId = uuidv4();
    const inviteCode = uuidv4().substring(0, 8);
    
    await dbRun(
      'INSERT INTO team_members (id, project_id, user_id, name, email, role) VALUES (?, ?, ?, ?, ?, ?)',
      [memberId, req.params.projectId, req.user.userId, name, email, role]
    );
    
    res.json({ memberId, inviteCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:projectId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    await dbRun(
      'DELETE FROM team_members WHERE id = ? AND project_id = ?',
      [req.params.memberId, req.params.projectId]
    );
    res.json({ message: 'Membre supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
