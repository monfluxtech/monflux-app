import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { detectPersona, getSystemPrompt } from '../prompts.js';

const router = express.Router();
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

router.post('/:projectId/message', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const { projectId } = req.params;
    
    // Get project
    const project = await dbGet(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.userId]
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    
    // Get user context
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.userId]);
    
    // Detect persona
    const persona = detectPersona(message);
    
    // Get recent messages for context
    const recentMessages = await dbAll(
      'SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at DESC LIMIT 5',
      [projectId]
    );
    
    // Build context
    const projectContext = {
      name: project.name,
      type: project.type,
      budget: project.budget,
      teamSize: user.team_size,
      sector: user.sector
    };
    
    const systemPrompt = getSystemPrompt(persona, projectContext);
    
    // Build conversation history for Claude
    const conversationHistory = recentMessages.reverse().map(msg => ({
      role: msg.message ? 'user' : 'assistant',
      content: msg.message || msg.response
    }));
    
    conversationHistory.push({
      role: 'user',
      content: message
    });
    
    // Call Claude API with streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullResponse = '';
    
    const stream = await client.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationHistory
    });
    
    stream.on('text', (text) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    });
    
    stream.on('end', async () => {
      // Save message and response to DB
      const messageId = uuidv4();
      await dbRun(
        'INSERT INTO chat_messages (id, project_id, user_id, message, response, persona) VALUES (?, ?, ?, ?, ?, ?)',
        [messageId, projectId, req.user.userId, message, fullResponse, persona]
      );
      
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });
    
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history
router.get('/:projectId/history', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const messages = await dbAll(
      'SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at DESC LIMIT 50',
      [projectId]
    );
    
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
