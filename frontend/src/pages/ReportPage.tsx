import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react';

interface Report {
  _id: string;
  createdAt: string;
  content: string;
  authenticityScore: number;
  author: string;
  analysisReport: {
    avgDelay: number;
    variance: number;
    totalPasteLength: number;
    editRatio: number;
    pauseRatio: number;
    cpm: number;
    flags: string[];
  };
  isEdited?: boolean;
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/sessions/report/${id}`);
        setReport(res.data);
      } catch {
        setError('Could not fetch report.');
      }
    };
    fetchReport();
  }, [id]);

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', fontFamily: 'var(--font-display)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', border: '1px solid var(--glass-border)', padding: '0.5rem 1rem', borderRadius: '4px', fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>← Dashboard</Link>
      </div>
    </div>
  );

  if (!report) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
      Loading report…
    </div>
  );

  const score = report.authenticityScore;
  const isSuspicious = score < 40;
  const isVerified = score >= 70;
  const wordCount = report.content.trim().split(/\s+/).length;
  const hasFlags = report.analysisReport.flags.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Top Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          color: 'var(--text-secondary)', textDecoration: 'none',
          fontFamily: 'var(--font-display)', fontSize: '0.85rem',
          transition: 'color 0.15s'
        }}>
          <ChevronLeft size={15} /> Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {report.isEdited && (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', border: '1px solid var(--glass-border)', padding: '0.1rem 0.5rem', borderRadius: '3px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              EDITED
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Authenticity Report
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem 6rem' }} className="animate-fade-in">

        {/* Header Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
              {new Date(report.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} · {report.author}
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              Session Analysis
            </h1>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
              {wordCount.toLocaleString()} words · {report.content.length.toLocaleString()} characters
            </p>
          </div>
          {/* Score block */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end',
              background: isVerified
                ? 'rgba(22,163,74,0.08)'
                : isSuspicious
                  ? 'rgba(220,38,38,0.08)'
                  : 'rgba(217,119,6,0.08)',
              border: `1px solid ${
                isVerified ? 'var(--success-color)' : isSuspicious ? 'var(--error-color)' : 'var(--warning-color)'
              }`,
              borderRadius: '6px', padding: '1rem 1.5rem'
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1,
                color: isVerified
                  ? 'var(--success-color)'
                  : isSuspicious
                    ? 'var(--error-color)'
                    : 'var(--warning-color)'
              }}>{score}</span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginTop: '0.3rem',
                color: isVerified
                  ? 'var(--success-color)'
                  : isSuspicious
                    ? 'var(--error-color)'
                    : 'var(--warning-color)',
                opacity: 0.85
              }}>/ 100 Authenticity</span>
              <span style={{
                marginTop: '0.6rem', fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                color: isVerified
                  ? 'var(--success-color)'
                  : isSuspicious
                    ? 'var(--error-color)'
                    : 'var(--warning-color)'
              }}>
                {isVerified
                  ? <><CheckCircle size={11} /> Verified Human</>
                  : isSuspicious
                    ? <><AlertTriangle size={11} /> AI-Suspected</>
                    : 'Review recommended'}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
            Typing Analysis
          </h2>
          <div style={{
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1px',
            background: 'var(--glass-border)'
          }}>
            {[
              { label: 'Avg. Pacing', value: `${Math.round(report.analysisReport.avgDelay)}ms`, sub: 'between keystrokes' },
              { label: 'Rhythm Variance', value: report.analysisReport.variance.toFixed(0), sub: 'std deviation ms' },
              { label: 'Deliberate Pauses', value: `${Math.round(report.analysisReport.pauseRatio * 100)}%`, sub: 'keystrokes ≥ 2s' },
              { label: 'Edit Volume', value: `${Math.round(report.analysisReport.editRatio * 100)}%`, sub: 'backspace rate' },
              { label: 'Pasted Content', value: `${report.analysisReport.totalPasteLength}`, sub: 'characters' },
              { label: 'Typing Speed', value: report.analysisReport.cpm ? `${Math.round(report.analysisReport.cpm)}` : '—', sub: 'chars per minute' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', padding: '1.2rem 1.4rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {m.value}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0.4rem 0 0.15rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.65 }}>
                  {m.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flags */}
        {hasFlags && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--error-color)', margin: '0 0 1rem' }}>
              Analysis Flags
            </h2>
            <div style={{ border: `1px solid var(--error-color)`, borderRadius: '6px', overflow: 'hidden', background: 'rgba(220,38,38,0.04)' }}>
              {report.analysisReport.flags.map((flag, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.8rem',
                  padding: '0.9rem 1.2rem',
                  borderBottom: i < report.analysisReport.flags.length - 1 ? '1px solid rgba(220,38,38,0.2)' : 'none',
                  background: 'transparent'
                }}>
                  <AlertTriangle size={13} style={{ color: 'var(--error-color)', marginTop: '3px', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--error-color)', lineHeight: 1.5 }}>{flag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>
              Transcribed Content
            </h2>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          </div>

          <article style={{
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            padding: '2.5rem 3rem',
            fontFamily: 'var(--font-base)',
            fontSize: '1.05rem',
            lineHeight: 2,
            color: 'var(--text-primary)'
          }}>
            {report.content.split('\n').map((para, i) => (
              <p key={i} style={{ margin: '0 0 1.6em', textIndent: '1.5em', textAlign: 'justify' }}>{para}</p>
            ))}
          </article>

          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)', opacity: 0.5, textAlign: 'center', marginTop: '3rem' }}>
            End of Report · Vi-Notes Authenticity Engine
          </p>
        </div>
      </div>
    </div>
  );
}
