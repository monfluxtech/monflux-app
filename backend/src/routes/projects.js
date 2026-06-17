import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await dbAll(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project detail
router.get('/:projectId', authenticateToken, async (req, res) => {
  try {
    const project = await dbGet(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [req.params.projectId, req.user.userId]
    );
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    
    const team = await dbAll(
      'SELECT id, name, email, role FROM team_members WHERE project_id = ?',
      [req.params.projectId]
    );
    
    res.json({ ...project, team });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, startDate, endDate, budget } = req.body;
    const projectId = uuidv4();
    
    await dbRun(
      'INSERT INTO projects (id, user_id, name, type, start_date, end_date, budget, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, req.user.userId, name, type, startDate, endDate, budget, 'active']
    );
    
    res.json({ projectId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { name, status, endDate, budget } = req.body;
    
    await dbRun(
      'UPDATE projects SET name = ?, status = ?, end_date = ?, budget = ? WHERE id = ? AND user_id = ?',
      [name, status, endDate, budget, req.params.projectId, req.user.userId]
    );
    
    res.json({ message: 'Projet mis à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:projectId', authenticateToken, async (req, res) => {
  try {
    await dbRun(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [req.params.projectId, req.user.userId]
    );
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
