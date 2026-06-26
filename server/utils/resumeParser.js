import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const normaliseText = (text = '') => {
  return String(text)
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
};

export const extractResumeTextFromFile = async (file) => {
  if (!file) return '';

  const mime = file.mimetype || '';
  const name = file.originalname || '';
  const lowerName = name.toLowerCase();

  if (mime.includes('pdf') || lowerName.endsWith('.pdf')) {
    const parsed = await pdfParse(file.buffer);
    return normaliseText(parsed.text || '');
  }

  if (
    mime.includes('wordprocessingml') ||
    mime.includes('msword') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc')
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return normaliseText(result.value || '');
  }

  if (mime.includes('text') || lowerName.endsWith('.txt')) {
    return normaliseText(file.buffer.toString('utf-8'));
  }

  throw new Error('Unsupported file type. Upload PDF, DOCX, DOC or TXT resume.');
};
