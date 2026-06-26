import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api.js';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await api.get('/interviews/reports');
        setReports(data.reports || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <main className="page">
      <section className="section-head">
        <p className="eyebrow">Saved history</p>
        <h1>Your resume-based interview reports</h1>
      </section>

      {loading && <p className="muted">Loading reports...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && reports.length === 0 && (
        <div className="empty-card">
          <h2>No reports yet</h2>
          <p>Upload your resume from the dashboard and start a personalized voice interview.</p>
          <Link className="primary-link" to="/">Start interview</Link>
        </div>
      )}

      <div className="report-grid">
        {reports.map((report) => (
          <Link className="report-card" to={`/reports/${report._id}`} key={report._id}>
            <div className="score-badge">{report.report?.overallScore ?? 0}</div>
            <h2>{report.targetRole}</h2>
            <p>{report.experience} · {report.difficulty} · {report.questionCount} resume questions</p>
            <p className="muted"><strong>Resume:</strong> {report.resumeAnalysis?.summary?.slice(0, 120) || 'Resume analysis saved'}...</p>
            <p className="muted"><strong>Feedback:</strong> {report.report?.summary?.slice(0, 120)}...</p>
            <small>{new Date(report.createdAt).toLocaleString()}</small>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default Reports;
