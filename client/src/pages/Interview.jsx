import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

const getSpeechRecognition = () => {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const normaliseQuestion = (item) => {
  if (typeof item === 'string') {
    return {
      question: item,
      category: 'Resume Based',
      resumeReference: 'Resume based',
      expectedSignals: []
    };
  }

  return {
    question: item?.question || item?.text || '',
    category: item?.category || 'Resume Based',
    resumeReference: item?.resumeReference || 'Resume based',
    expectedSignals: Array.isArray(item?.expectedSignals) ? item.expectedSignals : []
  };
};

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setup = location.state?.setup;
  const resumeAnalysis = location.state?.resumeAnalysis;
  const questions = useMemo(() => (location.state?.questions || []).map(normaliseQuestion), [location.state]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const recognitionRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!setup || questions.length === 0) {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      speak(`Question ${currentIndex + 1}. ${currentQuestion.question}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentIndex, currentQuestion?.question, navigate, questions.length, setup]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  const startRecording = () => {
    setError('');
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Use Chrome/Edge or type your answer manually.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setAnswerText((prev) => {
        const cleanPrev = prev.replace(/\s+\[speaking\.\.\.\].*$/i, '').trim();
        const combined = `${cleanPrev} ${finalTranscript}`.trim();
        return interimTranscript ? `${combined} [speaking...] ${interimTranscript}`.trim() : combined;
      });
    };

    recognition.onerror = (event) => {
      setError(`Mic error: ${event.error}. You can type the answer manually.`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setAnswerText((prev) => prev.replace(/\s+\[speaking\.\.\.\].*$/i, '').trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop?.();
    setIsRecording(false);
  };

  const repeatQuestion = () => {
    speak(`Question ${currentIndex + 1}. ${currentQuestion.question}`);
  };

  const submitFinalInterview = async (finalAnswers) => {
    setSubmitting(true);
    setError('');

    try {
      const { data } = await api.post('/interviews/submit', {
        ...setup,
        resumeAnalysis,
        qa: finalAnswers
      });

      speak('Interview completed. Your resume based report is ready.');
      navigate(`/reports/${data.interview._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit interview');
    } finally {
      setSubmitting(false);
    }
  };

  const saveAndNext = async () => {
    const cleanedAnswer = answerText.replace(/\s+\[speaking\.\.\.\].*$/i, '').trim();

    if (!cleanedAnswer) {
      setError('Please record or type your answer before moving to the next question.');
      return;
    }

    stopRecording();

    const updatedAnswers = [
      ...answers,
      {
        question: currentQuestion.question,
        category: currentQuestion.category,
        resumeReference: currentQuestion.resumeReference,
        expectedSignals: currentQuestion.expectedSignals,
        answer: cleanedAnswer
      }
    ];

    setAnswers(updatedAnswers);
    setAnswerText('');
    setError('');

    if (currentIndex + 1 >= totalQuestions) {
      await submitFinalInterview(updatedAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!setup || questions.length === 0) return null;

  return (
    <main className="page interview-page">
      <section className="interview-shell">
        <div className="interview-header">
          <div>
            <p className="eyebrow">Live resume-based voice interview</p>
            <h1>{setup.targetRole}</h1>
            <p className="muted">{setup.experience} · {setup.difficulty} · Question {currentIndex + 1}/{totalQuestions}</p>
          </div>
          <div className="progress-circle">{progress}%</div>
        </div>

        {resumeAnalysis?.focusAreas?.length > 0 && (
          <div className="focus-strip">
            {resumeAnalysis.focusAreas.slice(0, 4).map((area, index) => <span key={`${area}-${index}`}>{area}</span>)}
          </div>
        )}

        <div className="question-card">
          <div className="avatar-pulse">AI</div>
          <div>
            <p className="eyebrow">Interviewer asks · {currentQuestion.category}</p>
            <h2>{currentQuestion.question}</h2>
            <p className="resume-ref"><strong>Resume reference:</strong> {currentQuestion.resumeReference}</p>
            {currentQuestion.expectedSignals?.length > 0 && (
              <div className="signal-list">
                {currentQuestion.expectedSignals.slice(0, 4).map((signal, index) => <span key={`${signal}-${index}`}>{signal}</span>)}
              </div>
            )}
            <button className="secondary-btn" onClick={repeatQuestion}>🔊 Repeat question</button>
          </div>
        </div>

        <div className="answer-card">
          <div className="answer-header">
            <div>
              <p className="eyebrow">Your answer</p>
              <h2>Answer from your real resume experience</h2>
            </div>
            <div className={isRecording ? 'recording-dot active' : 'recording-dot'}>{isRecording ? 'Recording' : 'Idle'}</div>
          </div>

          <textarea
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            placeholder="Click Start Recording and answer like a real interview. Mention project name, your contribution, tech stack, bug/decision, and impact."
          />

          {error && <p className="error">{error}</p>}

          <div className="button-row">
            {!isRecording ? (
              <button className="secondary-btn" onClick={startRecording}>🎙️ Start recording</button>
            ) : (
              <button className="danger-btn" onClick={stopRecording}>⏹ Stop recording</button>
            )}
            <button className="primary-btn" onClick={saveAndNext} disabled={submitting}>
              {submitting ? 'Creating resume report...' : currentIndex + 1 === totalQuestions ? 'Finish interview' : 'Save & next'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Interview;
