import express from 'express';
import jwt from 'jsonwebtoken';
import Session from '../models/Session';
import { analyzeSession } from '../utils/analyzer';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfallback';

// Middleware to authenticate
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { content, delays, pasteEvents, editCount, navCount, sessionDuration } = req.body;
    
    // Process Authenticity ML Engine
    const analysis = analyzeSession(
      content || '',
      delays || [],
      pasteEvents || [],
      editCount || 0,
      navCount || 0,
      sessionDuration || 0
    );

    const session = new Session({
      user: req.user.id,
      content,
      delays: delays || [],
      editCount: editCount || 0,
      navCount: navCount || 0,
      sessionDuration: sessionDuration || 0,
      pasteEvents: pasteEvents || [],
      authenticityScore: analysis.score,
      analysisReport: analysis.report
    });
    
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save session' });
  }
});

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Public Route for Shareable Reports (No AuthMiddleware needed)
router.get('/report/:id', async (req: any, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('user', 'email'); // Populate basic user info
    if (!session) return res.status(404).json({ error: 'Report not found' });
    
    // We omit sensitive user keystroke/timing arrays for privacy, keeping just the high-level report
    res.json({
      _id: session._id,
      createdAt: session.get('createdAt'),
      content: session.content,
      authenticityScore: session.get('authenticityScore'),
      analysisReport: session.get('analysisReport'),
      isEdited: session.get('isEdited'),
      author: (session.user as any)?.email // Cast since TS may not infer populate strictly
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public report' });
  }
});
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const session = await Session.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { content, delays, pasteEvents, editCount, navCount, sessionDuration } = req.body;
    
    const existingSession = await Session.findOne({ _id: req.params.id, user: req.user.id });
    if (!existingSession) return res.status(404).json({ error: 'Session not found' });

    // Concatenate incremental ML updates 
    const combinedDelays = existingSession.get('delays').concat(delays || []);
    const combinedPasteEvents = existingSession.get('pasteEvents').concat(pasteEvents || []);
    const combinedEditCount = existingSession.get('editCount') + (editCount || 0);
    const combinedNavCount = existingSession.get('navCount') + (navCount || 0);
    const combinedSessionDuration = existingSession.get('sessionDuration') + (sessionDuration || 0);

    const analysis = analyzeSession(
      content || '',
      combinedDelays,
      combinedPasteEvents,
      combinedEditCount,
      combinedNavCount,
      combinedSessionDuration
    );

    existingSession.set({
      content,
      delays: combinedDelays,
      pasteEvents: combinedPasteEvents,
      editCount: combinedEditCount,
      navCount: combinedNavCount,
      sessionDuration: combinedSessionDuration,
      authenticityScore: analysis.score,
      analysisReport: analysis.report,
      isEdited: true
    });

    await existingSession.save();
    res.json(existingSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

export default router;
