import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    targetRole: 'Software Development Engineer',
    experience: 'Fresher',
    difficulty: 'Medium',
    questionCount: 5,
    resumeText: ''
  });
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const resumeWordCount = useMemo(() => {
    return form.resumeText.trim() ? form.resumeText.trim().split(/\s+/).length : 0;
  }, [form.resumeText]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: name === 'questionCount' ? Number(value) : value });
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setResumeFileName(file.name);
    setExtracting(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await api.post('/interviews/resume/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setForm((prev) => ({ ...prev, resumeText: data.resumeText || '' }));
      setResumeAnalysis(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not read resume. Paste the resume text manually below.');
    } finally {
      setExtracting(false);
    }
  };

  const startInterview = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.resumeText || form.resumeText.trim().length < 120) {
      setError('Resume upload/paste karna compulsory hai. Personalized questions resume ke basis par hi banenge.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/interviews/questions', form);
      setResumeAnalysis(data.resumeAnalysis || null);
      navigate('/interview', {
        state: {
          setup: form,
          questions: data.questions,
          resumeAnalysis: data.resumeAnalysis
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create resume-based interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="hero-grid wide-hero">
        <div className="hero-copy">
          <p className="eyebrow">Resume personalized voice mock</p>
          <h1>Interview questions from your own resume.</h1>
          <p>
            Upload or paste your resume. Gemini will find your projects, skills, tech stack and weak points, then ask voice questions exactly like a real interviewer.
          </p>
          <div className="feature-list">
            <span>📄 Resume upload</span>
            <span>🎯 Project-specific questions</span>
            <span>🎙️ Voice answer</span>
            <span>📊 Resume-based report</span>
          </div>

          <div className="content-card mini-card">
            <h2>Example questions it can ask</h2>
            <ul>
              <li>“Your resume mentions JWT auth. Explain the complete login flow.”</li>
              <li>“In your MERN project, what schema design did you use and why?”</li>
              <li>“What was the hardest bug in your microservices project?”</li>
            </ul>
          </div>
        </div>

        <form className="setup-card resume-setup-card" onSubmit={startInterview}>
          <h2>Interview setup</h2>

          <label>Target role</label>
          <input name="targetRole" value={form.targetRole} onChange={handleChange} placeholder="SDE, MERN Developer, Backend Developer" required />

          <div className="form-row">
            <div>
              <label>Experience</label>
              <select name="experience" value={form.experience} onChange={handleChange}>
                <option>Fresher</option>
                <option>Internship level</option>
                <option>1 year</option>
                <option>2 years</option>
                <option>3+ years</option>
              </select>
            </div>
            <div>
              <label>Difficulty</label>
              <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          <label>Questions</label>
          <select name="questionCount" value={form.questionCount} onChange={handleChange}>
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={7}>7</option>
            <option value={10}>10</option>
          </select>

          <label>Upload resume PDF/DOCX/TXT</label>
          <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleResumeUpload} />
          <p className="muted small-text">
            {extracting ? 'Reading resume...' : resumeFileName ? `Loaded: ${resumeFileName}` : 'Or paste your resume text below.'}
          </p>

          <label>Resume text</label>
          <textarea
            className="resume-textarea"
            name="resumeText"
            value={form.resumeText}
            onChange={handleChange}
            placeholder="Paste your resume here if upload does not work. Include projects, skills, internships, achievements and tech stack."
          />
          <p className="muted small-text">Words detected: {resumeWordCount}. Better resume text = better personalized questions.</p>

          {resumeAnalysis && <p className="success">Resume analyzed successfully.</p>}
          {error && <p className="error">{error}</p>}
          <button className="primary-btn" disabled={loading || extracting}>
            {loading ? 'Analyzing resume & generating questions...' : 'Start resume-based voice interview'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Dashboard;
