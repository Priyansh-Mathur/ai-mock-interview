import jsPDF from 'jspdf';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api.js';

const addWrappedText = (doc, text, x, y, maxWidth, lineHeight = 7) => {
  const lines = doc.splitTextToSize(String(text || ''), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const ensurePageSpace = (doc, y, needed = 20) => {
  if (y + needed > 280) {
    doc.addPage();
    return 18;
  }
  return y;
};

const ReportDetails = () => {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/interviews/reports/${id}`);
        setInterview(data.interview);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const speakReport = () => {
    if (!interview || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = `Your overall score is ${interview.report.overallScore}. Resume alignment score is ${interview.report.resumeAlignmentScore}. ${interview.report.summary}. Recommendation: ${interview.report.recommendation}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  };

  const downloadPDF = () => {
    if (!interview) return;

    const doc = new jsPDF();
    const margin = 14;
    const maxWidth = 180;
    let y = 18;

    doc.setFontSize(18);
    doc.text('Resume-Based AI Mock Interview Report', margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Role: ${interview.targetRole}`, margin, y);
    y += 7;
    doc.text(`Experience: ${interview.experience}`, margin, y);
    y += 7;
    doc.text(`Difficulty: ${interview.difficulty}`, margin, y);
    y += 7;
    doc.text(`Date: ${new Date(interview.createdAt).toLocaleString()}`, margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.text('Resume Summary', margin, y);
    y += 8;
    doc.setFontSize(11);
    y = addWrappedText(doc, interview.resumeAnalysis?.summary || 'Resume summary unavailable', margin, y, maxWidth);
    y += 5;

    doc.setFontSize(14);
    doc.text('Scores', margin, y);
    y += 8;
    doc.setFontSize(11);
    [
      `Overall: ${interview.report.overallScore}/100`,
      `Communication: ${interview.report.communicationScore}/100`,
      `Technical: ${interview.report.technicalScore}/100`,
      `Confidence: ${interview.report.confidenceScore}/100`,
      `Resume Alignment: ${interview.report.resumeAlignmentScore}/100`,
      `Project Depth: ${interview.report.projectDepthScore}/100`
    ].forEach((line) => {
      y = ensurePageSpace(doc, y, 10);
      doc.text(line, margin, y);
      y += 7;
    });
    y += 5;

    doc.setFontSize(14);
    doc.text('Evaluation Summary', margin, y);
    y += 8;
    doc.setFontSize(11);
    y = addWrappedText(doc, interview.report.summary, margin, y, maxWidth);
    y += 5;

    const printList = (title, items = []) => {
      y = ensurePageSpace(doc, y, 20);
      doc.setFontSize(14);
      doc.text(title, margin, y);
      y += 8;
      doc.setFontSize(11);
      items.forEach((point) => {
        y = ensurePageSpace(doc, y, 12);
        y = addWrappedText(doc, `• ${point}`, margin, y, maxWidth);
      });
      y += 5;
    };

    printList('Strengths', interview.report.strengths);
    printList('Improvements', interview.report.improvements);
    printList('Resume Concerns', interview.report.resumeConcerns);
    printList('Next Prep Plan', interview.report.nextPrepPlan);

    interview.qa?.forEach((item, index) => {
      y = ensurePageSpace(doc, y, 45);
      doc.setFontSize(13);
      y = addWrappedText(doc, `Q${index + 1}. ${item.question}`, margin, y, maxWidth);
      doc.setFontSize(11);
      y = addWrappedText(doc, `Category: ${item.category || 'Resume Based'}`, margin, y + 2, maxWidth);
      y = addWrappedText(doc, `Resume Reference: ${item.resumeReference || 'Resume based'}`, margin, y + 2, maxWidth);
      y = addWrappedText(doc, `Answer: ${item.answer}`, margin, y + 2, maxWidth);
      const feedback = interview.report.detailedFeedback?.[index];
      if (feedback) {
        y = addWrappedText(doc, `Feedback: ${feedback.answerQuality}`, margin, y + 2, maxWidth);
        y = addWrappedText(doc, `Resume Connection: ${feedback.resumeConnection || ''}`, margin, y + 2, maxWidth);
        y = addWrappedText(doc, `Score: ${feedback.score}/100`, margin, y + 2, maxWidth);
      }
      y += 6;
    });

    doc.save(`resume-mock-interview-report-${interview.targetRole.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  if (loading) return <main className="page"><p className="muted">Loading report...</p></main>;
  if (error) return <main className="page"><p className="error">{error}</p></main>;
  if (!interview) return null;

  const report = interview.report;
  const analysis = interview.resumeAnalysis || {};

  return (
    <main className="page">
      <section className="report-detail-hero">
        <div>
          <Link className="back-link" to="/reports">← Back to reports</Link>
          <p className="eyebrow">Resume-based interview report</p>
          <h1>{interview.targetRole}</h1>
          <p className="muted">{interview.experience} · {interview.difficulty} · {new Date(interview.createdAt).toLocaleString()}</p>
        </div>
        <div className="button-row">
          <button className="secondary-btn" onClick={speakReport}>🔊 Read report</button>
          <button className="primary-btn" onClick={downloadPDF}>Download PDF</button>
        </div>
      </section>

      <section className="score-grid six-scores">
        <div className="score-card"><span>{report.overallScore}</span><p>Overall</p></div>
        <div className="score-card"><span>{report.communicationScore}</span><p>Communication</p></div>
        <div className="score-card"><span>{report.technicalScore}</span><p>Technical</p></div>
        <div className="score-card"><span>{report.confidenceScore}</span><p>Confidence</p></div>
        <div className="score-card"><span>{report.resumeAlignmentScore}</span><p>Resume Alignment</p></div>
        <div className="score-card"><span>{report.projectDepthScore}</span><p>Project Depth</p></div>
      </section>

      <section className="content-card">
        <h2>Resume analysis</h2>
        <p>{analysis.summary}</p>
        <div className="tag-wrap">
          {analysis.skills?.map((skill, index) => <span key={`${skill}-${index}`}>{skill}</span>)}
        </div>
      </section>

      <section className="two-col">
        <div className="content-card">
          <h2>Projects detected</h2>
          <ul>{analysis.projects?.map((point, index) => <li key={index}>{point}</li>)}</ul>
        </div>
        <div className="content-card">
          <h2>Focus areas</h2>
          <ul>{analysis.focusAreas?.map((point, index) => <li key={index}>{point}</li>)}</ul>
        </div>
      </section>

      <section className="content-card">
        <h2>Evaluation summary</h2>
        <p>{report.summary}</p>
        <h2>Recommendation</h2>
        <p>{report.recommendation}</p>
      </section>

      <section className="two-col">
        <div className="content-card">
          <h2>Strengths</h2>
          <ul>{report.strengths?.map((point, index) => <li key={index}>{point}</li>)}</ul>
        </div>
        <div className="content-card">
          <h2>Improvements</h2>
          <ul>{report.improvements?.map((point, index) => <li key={index}>{point}</li>)}</ul>
        </div>
      </section>

      <section className="two-col">
        <div className="content-card warning-card">
          <h2>Resume concerns</h2>
          <ul>{report.resumeConcerns?.map((point, index) => <li key={index}>{point}</li>)}</ul>
        </div>
        <div className="content-card prep-card">
          <h2>Next prep plan</h2>
          <ul>{report.nextPrepPlan?.map((point, index) => <li key={index}>{point}</li>)}</ul>
        </div>
      </section>

      <section className="content-card">
        <h2>Question-wise resume review</h2>
        <div className="qa-list">
          {interview.qa?.map((item, index) => {
            const feedback = report.detailedFeedback?.[index];
            return (
              <article className="qa-item" key={`${item.question}-${index}`}>
                <p className="eyebrow">{item.category} · Resume reference: {item.resumeReference}</p>
                <h3>Q{index + 1}. {item.question}</h3>
                <p><strong>Your answer:</strong> {item.answer}</p>
                {feedback && (
                  <>
                    <p><strong>Feedback:</strong> {feedback.answerQuality}</p>
                    <p><strong>Resume connection:</strong> {feedback.resumeConnection}</p>
                    <p><strong>Score:</strong> {feedback.score}/100</p>
                    <ul>{feedback.idealPoints?.map((point, idx) => <li key={idx}>{point}</li>)}</ul>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default ReportDetails;
