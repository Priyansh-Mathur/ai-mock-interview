import { GoogleGenAI } from '@google/genai';

const isMissingKey = () => {
  const key = process.env.GEMINI_API_KEY;
  return !key || key.includes('PASTE_YOUR') || key.trim().length < 20;
};

const getClient = () => {
  if (isMissingKey()) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const cleanJsonText = (text) => {
  if (!text) return '';
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
};

const parseJsonSafely = (text, fallback) => {
  try {
    const cleaned = cleanJsonText(text);
    const firstArray = cleaned.indexOf('[');
    const firstObject = cleaned.indexOf('{');
    let start = 0;

    if (firstArray === -1) start = firstObject;
    else if (firstObject === -1) start = firstArray;
    else start = Math.min(firstArray, firstObject);

    const jsonCandidate = start >= 0 ? cleaned.slice(start) : cleaned;
    return JSON.parse(jsonCandidate);
  } catch (error) {
    return fallback;
  }
};

const trimResume = (resumeText = '') => {
  return String(resumeText)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);
};

const normaliseQuestion = (item, index) => {
  if (typeof item === 'string') {
    return {
      question: item,
      category: index === 0 ? 'Introduction' : 'Resume Deep Dive',
      resumeReference: 'Resume based',
      expectedSignals: ['Clear explanation', 'Concrete resume example', 'Impact and trade-offs']
    };
  }

  return {
    question: String(item.question || item.text || '').trim(),
    category: String(item.category || 'Resume Deep Dive').trim(),
    resumeReference: String(item.resumeReference || item.source || 'Resume based').trim(),
    expectedSignals: Array.isArray(item.expectedSignals)
      ? item.expectedSignals.map(String).slice(0, 5)
      : ['Clear explanation', 'Concrete resume example', 'Impact and trade-offs']
  };
};

const fallbackResumeAnalysis = ({ resumeText, targetRole }) => {
  const text = trimResume(resumeText);
  const lower = text.toLowerCase();
  const skills = [];
  const possibleSkills = [
    'React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Java', 'Spring Boot',
    'Microservices', 'JWT', 'REST API', 'SQL', 'Python', 'Docker', 'Git', 'Cloudinary'
  ];

  possibleSkills.forEach((skill) => {
    if (lower.includes(skill.toLowerCase().replace('.', ''))) skills.push(skill);
    else if (lower.includes(skill.toLowerCase())) skills.push(skill);
  });

  return {
    summary: `Resume parsed for ${targetRole || 'the target role'}. The interview will focus on the candidate's listed projects, skills and practical implementation decisions.`,
    skills: skills.length ? skills.slice(0, 10) : ['Project explanation', 'Technical fundamentals', 'Problem solving'],
    projects: ['Project mentioned in resume'],
    likelyStrengths: ['Hands-on project experience', 'Role-specific technical exposure'],
    possibleGaps: ['Depth of implementation details', 'System design trade-offs', 'Measurable project impact'],
    focusAreas: ['Project deep dive', 'Technology choices', 'Debugging and trade-offs', 'Resume-based HR questions']
  };
};

const fallbackQuestions = ({ targetRole, difficulty, questionCount, resumeAnalysis }) => {
  const role = targetRole || 'Software Developer';
  const skills = resumeAnalysis?.skills?.slice(0, 4).join(', ') || 'your listed skills';
  const project = resumeAnalysis?.projects?.[0] || 'your main resume project';

  const base = [
    {
      question: `Walk me through your resume and connect your projects with the ${role} role.`,
      category: 'Introduction',
      resumeReference: 'Overall resume',
      expectedSignals: ['Clear career story', 'Relevant skills', 'Confidence']
    },
    {
      question: `In ${project}, what real problem were you solving and what was your exact contribution?`,
      category: 'Project Deep Dive',
      resumeReference: project,
      expectedSignals: ['Problem statement', 'Ownership', 'Implementation detail', 'Impact']
    },
    {
      question: `Your resume mentions ${skills}. Which one are you strongest in, and prove it with a project example.`,
      category: 'Skills Validation',
      resumeReference: skills,
      expectedSignals: ['Skill depth', 'Project evidence', 'Trade-offs']
    },
    {
      question: `What was the hardest bug or error you faced in a resume project, and how did you debug it step by step?`,
      category: 'Debugging',
      resumeReference: 'Resume projects',
      expectedSignals: ['Debugging process', 'Root cause', 'Fix', 'Learning']
    },
    {
      question: `If I ask you to scale your resume project for thousands of users, what changes would you make first?`,
      category: 'System Design',
      resumeReference: project,
      expectedSignals: ['Database thinking', 'API design', 'Caching', 'Deployment']
    },
    {
      question: `Why did you choose the tech stack mentioned in your resume instead of alternatives?`,
      category: 'Technical Decision',
      resumeReference: 'Tech stack',
      expectedSignals: ['Reasoning', 'Alternatives', 'Pros and cons']
    },
    {
      question: `Pick one feature from your resume project and explain the complete flow from frontend to backend to database.`,
      category: 'Full Stack Flow',
      resumeReference: project,
      expectedSignals: ['End-to-end flow', 'APIs', 'Database schema', 'Error handling']
    },
    {
      question: `What part of your resume feels weakest, and what are you doing to improve it?`,
      category: 'HR + Self Awareness',
      resumeReference: 'Overall resume',
      expectedSignals: ['Honesty', 'Growth mindset', 'Concrete plan']
    }
  ];

  if (difficulty === 'Hard') {
    base.push(
      {
        question: `Defend one design decision from your resume project. What would break if traffic increased by 100x?`,
        category: 'Hard System Design',
        resumeReference: project,
        expectedSignals: ['Bottlenecks', 'Failure handling', 'Scaling trade-offs']
      },
      {
        question: `How would you test, secure and deploy the strongest project on your resume for production?`,
        category: 'Production Readiness',
        resumeReference: project,
        expectedSignals: ['Testing', 'Security', 'CI/CD', 'Monitoring']
      }
    );
  }

  return base.slice(0, Number(questionCount) || 5);
};

export const analyzeResume = async ({ resumeText, targetRole }) => {
  const resume = trimResume(resumeText);
  const fallback = fallbackResumeAnalysis({ resumeText: resume, targetRole });
  const ai = getClient();

  if (!ai) return fallback;

  const prompt = `
You are an ATS and technical interview coach.
Analyze this candidate resume for a ${targetRole || 'software'} interview.

Resume text:
${resume}

Return ONLY valid JSON in this shape:
{
  "summary": "4-5 line practical summary of the resume",
  "skills": ["skill 1", "skill 2"],
  "projects": ["project name or short project title"],
  "likelyStrengths": ["strength 1", "strength 2"],
  "possibleGaps": ["gap 1", "gap 2"],
  "focusAreas": ["area 1", "area 2", "area 3"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.3 }
    });

    const parsed = parseJsonSafely(response.text, fallback);
    return {
      ...fallback,
      ...parsed,
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(String).slice(0, 15) : fallback.skills,
      projects: Array.isArray(parsed.projects) ? parsed.projects.map(String).slice(0, 10) : fallback.projects,
      likelyStrengths: Array.isArray(parsed.likelyStrengths) ? parsed.likelyStrengths.map(String).slice(0, 6) : fallback.likelyStrengths,
      possibleGaps: Array.isArray(parsed.possibleGaps) ? parsed.possibleGaps.map(String).slice(0, 6) : fallback.possibleGaps,
      focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas.map(String).slice(0, 8) : fallback.focusAreas
    };
  } catch (error) {
    console.error('Gemini resume analysis error:', error.message);
    return fallback;
  }
};

export const generateResumeInterviewQuestions = async ({
  targetRole,
  experience,
  difficulty,
  questionCount,
  resumeText,
  resumeAnalysis
}) => {
  const count = Math.min(Math.max(Number(questionCount) || 5, 3), 10);
  const fallback = fallbackQuestions({ targetRole, difficulty, questionCount: count, resumeAnalysis });
  const resume = trimResume(resumeText);
  const ai = getClient();

  if (!ai) return fallback;

  const prompt = `
You are a senior interviewer conducting a REAL mock interview.
Generate exactly ${count} personalized questions from the candidate's resume.

Target role: ${targetRole}
Experience level: ${experience}
Difficulty: ${difficulty}
Resume analysis:
${JSON.stringify(resumeAnalysis, null, 2)}

Resume text:
${resume}

Rules:
- Questions must be based on the actual resume, not generic random questions.
- Ask about specific projects, skills, tools, achievements, tech stack choices, bugs, APIs, database schema, deployment, leadership and gaps found in the resume.
- Include follow-up style questions that an interviewer would actually ask.
- Keep each question short enough to be spoken aloud.
- Do not invent fake projects or companies. If detail is missing, ask a question about that missing detail.
- Return ONLY valid JSON array of objects.

Object shape:
[
  {
    "question": "question to ask aloud",
    "category": "Project Deep Dive | Skill Validation | HR | System Design | Debugging | Resume Gap",
    "resumeReference": "exact resume part this question is based on",
    "expectedSignals": ["what a good answer should include"]
  }
]
`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.65 }
    });

    const parsed = parseJsonSafely(response.text, fallback);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .map(normaliseQuestion)
        .filter((item) => item.question)
        .slice(0, count);
    }
    return fallback;
  } catch (error) {
    console.error('Gemini question generation error:', error.message);
    return fallback;
  }
};

export const evaluateInterview = async ({ targetRole, experience, difficulty, qa, resumeText, resumeAnalysis }) => {
  const fallback = {
    overallScore: 72,
    communicationScore: 70,
    technicalScore: 72,
    confidenceScore: 74,
    resumeAlignmentScore: 70,
    projectDepthScore: 68,
    summary: 'Demo evaluation generated because Gemini API key is missing or unavailable. Add your Gemini API key in server/.env for AI-generated resume-based feedback.',
    strengths: ['Attempted all questions', 'Connected answers with resume projects', 'Completed the full voice interview flow'],
    improvements: ['Add more implementation details from resume projects', 'Use STAR method for behavioral answers', 'Explain technical decisions with trade-offs'],
    detailedFeedback: qa.map((item) => ({
      question: item.question,
      answerQuality: item.answer?.length > 50 ? 'Answer has useful detail but can be more structured around resume evidence.' : 'Answer is too short and needs resume-specific examples.',
      idealPoints: item.expectedSignals?.length ? item.expectedSignals : ['Clear explanation', 'Resume evidence', 'Impact or result', 'Trade-offs when relevant'],
      resumeConnection: item.resumeReference || 'Resume based',
      score: Math.min(86, 58 + Math.floor((item.answer?.length || 0) / 18))
    })),
    resumeConcerns: ['Prepare deeper explanation for each resume project', 'Be ready to discuss measurable impact and deployment details'],
    nextPrepPlan: ['Revise every project end-to-end', 'Prepare 2 bugs faced in each project', 'Practice explaining tech stack choices'],
    recommendation: 'Keep practicing resume-specific answers and add measurable impact wherever possible.'
  };

  const ai = getClient();
  if (!ai) return fallback;

  const resume = trimResume(resumeText);
  const prompt = `
You are a strict but helpful technical interviewer.
Evaluate this candidate's mock interview using their resume as the source of truth.

Target role: ${targetRole}
Experience: ${experience}
Difficulty: ${difficulty}
Resume analysis:
${JSON.stringify(resumeAnalysis, null, 2)}

Resume text:
${resume}

Question-answer transcript:
${JSON.stringify(qa, null, 2)}

Evaluate specifically:
- Did the answer match the resume claim?
- Did the candidate explain implementation depth?
- Did they show ownership, debugging, trade-offs and impact?
- Did they sound ready for a real interview?

Return ONLY valid JSON in this exact shape:
{
  "overallScore": number from 0 to 100,
  "communicationScore": number from 0 to 100,
  "technicalScore": number from 0 to 100,
  "confidenceScore": number from 0 to 100,
  "resumeAlignmentScore": number from 0 to 100,
  "projectDepthScore": number from 0 to 100,
  "summary": "short paragraph",
  "strengths": ["point 1", "point 2", "point 3"],
  "improvements": ["point 1", "point 2", "point 3"],
  "detailedFeedback": [
    {
      "question": "original question",
      "answerQuality": "specific feedback",
      "idealPoints": ["ideal point 1", "ideal point 2"],
      "resumeConnection": "how well answer matched resume",
      "score": number from 0 to 100
    }
  ],
  "resumeConcerns": ["concern 1", "concern 2"],
  "nextPrepPlan": ["step 1", "step 2", "step 3"],
  "recommendation": "final hiring/interview readiness recommendation"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.35 }
    });

    const parsed = parseJsonSafely(response.text, fallback);
    return {
      ...fallback,
      ...parsed,
      detailedFeedback: Array.isArray(parsed.detailedFeedback) ? parsed.detailedFeedback : fallback.detailedFeedback,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallback.strengths,
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : fallback.improvements,
      resumeConcerns: Array.isArray(parsed.resumeConcerns) ? parsed.resumeConcerns : fallback.resumeConcerns,
      nextPrepPlan: Array.isArray(parsed.nextPrepPlan) ? parsed.nextPrepPlan : fallback.nextPrepPlan
    };
  } catch (error) {
    console.error('Gemini evaluation error:', error.message);
    return fallback;
  }
};
