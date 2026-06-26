import Interview from '../models/Interview.js';
import { analyzeResume, evaluateInterview, generateResumeInterviewQuestions } from '../utils/gemini.js';
import { extractResumeTextFromFile } from '../utils/resumeParser.js';

const cleanResumeText = (resumeText = '') => {
  return String(resumeText)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);
};

export const extractResume = async (req, res) => {
  try {
    const fileText = req.file ? await extractResumeTextFromFile(req.file) : '';
    const pastedText = cleanResumeText(req.body.resumeText || '');
    const resumeText = cleanResumeText(fileText || pastedText);

    if (!resumeText || resumeText.length < 80) {
      return res.status(400).json({
        message: 'Resume text could not be extracted properly. Upload a text-based PDF/DOCX or paste resume text manually.'
      });
    }

    return res.json({ resumeText, characters: resumeText.length });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Resume extraction failed' });
  }
};

export const createQuestions = async (req, res) => {
  try {
    const { targetRole, experience, difficulty, questionCount, resumeText } = req.body;

    if (!targetRole || !experience) {
      return res.status(400).json({ message: 'Target role and experience are required' });
    }

    const cleanedResume = cleanResumeText(resumeText);
    if (!cleanedResume || cleanedResume.length < 120) {
      return res.status(400).json({ message: 'Paste or upload your resume first so AI can ask personalized questions.' });
    }

    const resumeAnalysis = await analyzeResume({
      resumeText: cleanedResume,
      targetRole
    });

    const questions = await generateResumeInterviewQuestions({
      targetRole,
      experience,
      difficulty: difficulty || 'Medium',
      questionCount: questionCount || 5,
      resumeText: cleanedResume,
      resumeAnalysis
    });

    return res.json({ questions, resumeAnalysis });
  } catch (error) {
    return res.status(500).json({ message: 'Question generation failed', error: error.message });
  }
};

export const submitInterview = async (req, res) => {
  try {
    const { targetRole, experience, difficulty, qa, resumeText, resumeAnalysis } = req.body;

    if (!targetRole || !experience || !Array.isArray(qa) || qa.length === 0) {
      return res.status(400).json({ message: 'Interview details and answers are required' });
    }

    const cleanedResume = cleanResumeText(resumeText);
    if (!cleanedResume || cleanedResume.length < 120) {
      return res.status(400).json({ message: 'Resume text is required for personalized evaluation' });
    }

    const cleanedQa = qa.map((item) => ({
      question: String(item.question || '').trim(),
      answer: String(item.answer || '').trim(),
      category: String(item.category || 'Resume Based').trim(),
      resumeReference: String(item.resumeReference || 'Resume based').trim(),
      expectedSignals: Array.isArray(item.expectedSignals) ? item.expectedSignals.map(String).slice(0, 5) : []
    })).filter((item) => item.question && item.answer);

    if (cleanedQa.length === 0) {
      return res.status(400).json({ message: 'At least one answered question is required' });
    }

    const finalResumeAnalysis = resumeAnalysis?.summary
      ? resumeAnalysis
      : await analyzeResume({ resumeText: cleanedResume, targetRole });

    const report = await evaluateInterview({
      targetRole,
      experience,
      difficulty: difficulty || 'Medium',
      qa: cleanedQa,
      resumeText: cleanedResume,
      resumeAnalysis: finalResumeAnalysis
    });

    const interview = await Interview.create({
      user: req.user._id,
      targetRole,
      experience,
      difficulty: difficulty || 'Medium',
      questionCount: cleanedQa.length,
      resumeText: cleanedResume,
      resumeAnalysis: finalResumeAnalysis,
      qa: cleanedQa,
      report
    });

    return res.status(201).json({ interview });
  } catch (error) {
    return res.status(500).json({ message: 'Interview submission failed', error: error.message });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const reports = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('targetRole experience difficulty questionCount resumeAnalysis.summary report.overallScore report.resumeAlignmentScore report.summary createdAt');

    return res.json({ reports });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });

    if (!interview) {
      return res.status(404).json({ message: 'Report not found' });
    }

    return res.json({ interview });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch report', error: error.message });
  }
};
