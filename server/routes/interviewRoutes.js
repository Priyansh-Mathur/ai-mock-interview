import express from 'express';
import multer from 'multer';
import { createQuestions, extractResume, getMyReports, getReportById, submitInterview } from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/resume/extract', protect, upload.single('resume'), extractResume);
router.post('/questions', protect, createQuestions);
router.post('/submit', protect, submitInterview);
router.get('/reports', protect, getMyReports);
router.get('/reports/:id', protect, getReportById);

export default router;
