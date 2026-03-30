import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Save, X, AlertTriangle, Clock } from 'lucide-react';
import { API } from "../api";

interface EditorProps {
  onCancel: () => void;
  onSave: () => void;
  initialSession?: any;
}

interface PasteEvent {
  length: number;
  timestamp: number;
}

function computeLiveMetrics(delays: number[], content: string, sessionStartTime: number | null) {
  if (delays.length === 0) return { cpm: 0 };
  let cpm = 0;
  if (sessionStartTime) {
    const minutesElapsed = (Date.now() - sessionStartTime) / 60000;
    if (minutesElapsed > 0) cpm = Math.round(content.length / minutesElapsed);
  }
  return { cpm };
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function Editor({ onCancel, onSave, initialSession }: EditorProps) {
  const [content, setContent] = useState(initialSession?.content || '');
  const [delays, setDelays] = useState<number[]>([]);
  const [editCount, setEditCount] = useState<number>(0);
  const [pasteEvents, setPasteEvents] = useState<PasteEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [navCount, setNavCount] = useState<number>(0);
  const [liveMetrics, setLiveMetrics] = useState({ cpm: 0 });
  const [elapsed, setElapsed] = useState(0);

  const lastKeyPressTime = useRef<number | null>(null);
  const sessionStartTime = useRef<number | null>(null);
  const sessionEndTime = useRef<number | null>(null);

  // Clock + metrics ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStartTime.current) {
        setElapsed(Date.now() - sessionStartTime.current);
        setLiveMetrics(computeLiveMetrics(delays, content, sessionStartTime.current));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [delays, content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const now = Date.now();
    if (sessionStartTime.current === null) sessionStartTime.current = now;
    sessionEndTime.current = now;

    const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
    if (navKeys.includes(e.key)) setNavCount(prev => prev + 1);

    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Delete') {
      if (lastKeyPressTime.current !== null) {
        setDelays(prev => {
          const updated = [...prev, now - lastKeyPressTime.current!];
          setLiveMetrics(computeLiveMetrics(updated, content, sessionStartTime.current));
          return updated;
        });
      }
      lastKeyPressTime.current = now;
      if (e.key === 'Backspace' || e.key === 'Delete') setEditCount(prev => prev + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > 0) {
      setPasteEvents(prev => [...prev, { length: pastedText.length, timestamp: Date.now() }]);
      setPasteWarning(true);
      setTimeout(() => setPasteWarning(false), 4000);
    }
  };

  const saveSession = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    let sessionDuration = 0;
    if (sessionStartTime.current && sessionEndTime.current) {
      sessionDuration = sessionEndTime.current - sessionStartTime.current;
    }
    try {
      const token = localStorage.getItem('token');
      const payload = { content, delays, pasteEvents, editCount, navCount, sessionDuration };
      if (initialSession) {
        await axios.put(`${API}/api/sessions/${initialSession._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/api/sessions`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onSave();
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const totalPasted = pasteEvents.reduce((a, b) => a + b.length, 0);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>

      {/* Top Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 1.5rem', height: '52px',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--bg-secondary)',
        flexShrink: 0
      }}>
        {/* Left: title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-primary)', opacity: delays.length > 0 ? 1 : 0.3, transition: 'opacity 0.5s' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {initialSession ? 'Editing Session' : 'New Session'}
          </span>
          {pasteWarning && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.75rem', color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', animation: 'fadeIn 0.2s ease'
            }}>
              <AlertTriangle size={12} /> Paste recorded
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={onCancel}
            disabled={isSaving}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontFamily: 'var(--font-display)',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.7rem', borderRadius: '4px'
            }}
          >
            <X size={14} /> Discard
          </button>
          <button
            className="btn btn-primary"
            onClick={saveSession}
            disabled={isSaving || !content.trim()}
            style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Save size={14} /> {isSaving ? 'Verifying…' : 'Save & Verify'}
          </button>
        </div>
      </div>

      {/* Main Writing Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Textarea column */}
        <textarea
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            padding: '4rem 5rem',
            fontSize: '1.15rem',
            lineHeight: 2,
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-base)',
            caretColor: 'var(--text-primary)',
          }}
          placeholder="Begin writing here…"
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          autoFocus
        />

        {/* Right Sidebar — live stats */}
        <div style={{
          width: '160px',
          flexShrink: 0,
          borderLeft: '1px solid var(--glass-border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 1.2rem',
          gap: '2rem'
        }}>
          {/* Session time */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <Clock size={11} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                Time
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {elapsed > 0 ? formatDuration(elapsed) : '—'}
            </div>
          </div>

          {[
            { label: 'Words', value: wordCount || '—' },
            { label: 'Characters', value: charCount || '—' },
            { label: 'Keystrokes', value: delays.length || '—' },
            { label: 'CPM', value: liveMetrics.cpm > 0 ? liveMetrics.cpm : '—' },
            { label: 'Edits', value: editCount || '—' },
            { label: 'Pasted', value: totalPasted > 0 ? `${totalPasted} ch` : 'None' },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700,
                color: stat.label === 'Pasted' && totalPasted > 0 ? 'var(--text-primary)' : 'var(--text-primary)',
                background: stat.label === 'Pasted' && totalPasted > 0 ? 'var(--text-primary)' : 'transparent',
                WebkitTextFillColor: stat.label === 'Pasted' && totalPasted > 0 ? 'var(--bg-primary)' : undefined,
                display: 'inline-block',
                padding: stat.label === 'Pasted' && totalPasted > 0 ? '0 4px' : undefined,
                borderRadius: stat.label === 'Pasted' && totalPasted > 0 ? '3px' : undefined,
              }}>
                {stat.value}
              </div>
            </div>
          ))}

          {/* ML status pill */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '0.62rem', textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.5rem'
            }}>
              ML Status
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              border: '1px solid var(--glass-border)', borderRadius: '20px',
              padding: '0.25rem 0.6rem',
              fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--text-secondary)'
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-primary)', opacity: delays.length > 0 ? 1 : 0.3 }} />
              {delays.length > 0 ? 'Monitoring' : 'Waiting'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div style={{
        height: '28px',
        borderTop: '1px solid var(--glass-border)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        gap: '1.5rem',
        flexShrink: 0
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          {wordCount} words
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          {charCount} characters
        </span>
        {delays.length > 0 && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {delays.length} keystrokes recorded
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
          Vi-Notes · ML Authenticity Engine
        </span>
      </div>
    </div>
  );
}
