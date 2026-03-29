import { useState, useEffect } from 'react';
import axios from 'axios';
import { PencilLine, FileText, LogOut, Trash2, Plus } from 'lucide-react';
import Editor from '../components/Editor';

interface Session {
  _id: string;
  content: string;
  createdAt: string;
  delays: number[];
  editCount: number;
  pasteEvents: { length: number; timestamp: number }[];
  authenticityScore: number;
  isEdited?: boolean;
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfirmDeleteId(null);
      fetchSessions();
    } catch {
      setConfirmDeleteId(null);
    }
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setIsWriting(true);
  };

  if (isWriting) {
    return (
      <Editor
        initialSession={editingSession}
        onCancel={() => { setIsWriting(false); setEditingSession(null); }}
        onSave={() => { setIsWriting(false); setEditingSession(null); fetchSessions(); }}
      />
    );
  }

  // Summary stats
  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((a, b) => a + (b.authenticityScore ?? 0), 0) / totalSessions)
    : 0;
  const totalWords = sessions.reduce((a, s) => a + (s.content?.split(/\s+/).length || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Top Navigation Bar */}
      <nav style={{
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--bg-secondary)',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-primary)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' }}>
            Vi-Notes
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => { setIsWriting(true); setEditingSession(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Plus size={15} /> New Session
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
              gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem'
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </nav>

      <div className="container animate-fade-in" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>

        {/* Summary Stats Row */}
        {totalSessions > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'var(--glass-border)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '3rem'
          }}>
            {[
              { label: 'Total Sessions', value: totalSessions },
              { label: 'Avg. Authenticity', value: `${avgScore} / 100` },
              { label: 'Total Words Written', value: totalWords.toLocaleString() }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', padding: '1.5rem 2rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>
            Writing Sessions
          </h2>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {totalSessions} {totalSessions === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {/* Empty State */}
        {sessions.length === 0 ? (
          <div style={{
            border: '1px dashed var(--glass-border)',
            borderRadius: '6px',
            padding: '5rem 2rem',
            textAlign: 'center'
          }}>
            <FileText size={32} style={{ opacity: 0.25, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', fontSize: '1rem', margin: '0 0 0.5rem' }}>
              No writing sessions yet
            </p>
            <p style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 2rem', opacity: 0.7 }}>
              Start writing to build your authenticity record.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => { setIsWriting(true); setEditingSession(null); }}
            >
              <Plus size={16} /> Start Writing
            </button>
          </div>
        ) : (
          /* Session Table */
          <div style={{ border: '1px solid var(--glass-border)', borderRadius: '6px', overflow: 'hidden' }}>
            {/* Table Head */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 90px 120px',
              padding: '0.6rem 1.5rem',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--glass-border)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)'
            }}>
              <span>Document</span>
              <span style={{ textAlign: 'center' }}>Score</span>
              <span style={{ textAlign: 'center' }}>Date</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {/* Table Rows */}
            {sessions.map((session, i) => {
              const score = session.authenticityScore ?? 0;
              const isSuspicious = score < 40;
              const isVerified = score >= 70;
              const isConfirming = confirmDeleteId === session._id;

              const scoreColor = isVerified
                ? 'var(--success-color)'
                : isSuspicious
                  ? 'var(--error-color)'
                  : 'var(--warning-color)';

              return (
                <div
                  key={session._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 90px 120px',
                    padding: '1rem 1.5rem',
                    alignItems: 'center',
                    borderBottom: i < sessions.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    background: 'var(--bg-primary)',
                    transition: 'background 0.15s',
                    borderLeft: `3px solid ${scoreColor}`
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-primary)')}
                >
                  {/* Document Preview */}
                  <div style={{ overflow: 'hidden', paddingRight: '1rem' }}>
                    <p style={{
                      margin: 0,
                      fontFamily: 'var(--font-base)',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.4
                    }}>
                      {session.content || 'Empty document'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {session.content?.split(/\s+/).length || 0} words · {session.delays?.length || 0} keystrokes
                      </span>
                      {session.isEdited && (
                        <span style={{
                          fontFamily: 'var(--font-display)', fontSize: '0.62rem',
                          border: '1px solid var(--glass-border)', padding: '0 0.3rem',
                          borderRadius: '3px', color: 'var(--text-secondary)', lineHeight: '1.6'
                        }}>
                          EDITED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: scoreColor,
                      display: 'inline-block'
                    }}>
                      {score}
                    </span>
                  </div>

                  {/* Date */}
                  <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {new Date(session.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                    {isConfirming ? (
                      <>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Delete?</span>
                        <button onClick={() => handleDelete(session._id)} style={{
                          background: 'var(--text-primary)', border: 'none', color: 'var(--bg-primary)',
                          cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '3px',
                          fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-display)'
                        }}>Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{
                          background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
                          cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '3px',
                          fontSize: '0.72rem', fontFamily: 'var(--font-display)'
                        }}>No</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(session)} title="Edit" style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-secondary)', padding: '0.35rem', borderRadius: '4px',
                          display: 'flex', alignItems: 'center', transition: 'all 0.15s'
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--glass-border)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <PencilLine size={15} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(session._id)} title="Delete" style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-secondary)', padding: '0.35rem', borderRadius: '4px',
                          display: 'flex', alignItems: 'center', transition: 'all 0.15s'
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--glass-border)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 size={15} />
                        </button>
                        <a href={`/report/${session._id}`} target="_blank" rel="noreferrer" title="Full Report" style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-secondary)', padding: '0.35rem', borderRadius: '4px',
                          display: 'flex', alignItems: 'center', transition: 'all 0.15s', textDecoration: 'none'
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--glass-border)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <FileText size={15} />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
