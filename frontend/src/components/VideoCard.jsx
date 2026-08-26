import { useState } from 'react';
import {
  Play,
  Loader2,
  Lock,
  Unlock,
  AlertCircle,
  RotateCcw,
  UserPlus,
  Video,
} from 'lucide-react';

const ACCESS_LABELS = {
  FREE: { text: 'Video miễn phí — cần đăng nhập', color: '#16a34a', icon: Unlock },
  PAID: { text: 'Video khóa học trả phí', color: '#ea580c', icon: Lock },
  INHERIT: { text: 'Theo khóa học', color: '#2563eb', icon: Video },
};

export default function VideoCard({ lesson, onLoadVideo, onRequestEnroll }) {
  const [state, setState] = useState('idle'); // idle | loading | loaded | error
  const [video, setVideo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deniedStatus, setDeniedStatus] = useState(null);

  const label = ACCESS_LABELS[lesson.accessType] ?? {
    text: lesson.accessType,
    color: '#6b7280',
    icon: Video,
  };
  const LabelIcon = label.icon;

  async function handleOpen() {
    if (state === 'loaded') {
      setState('idle');
      return;
    }
    setState('loading');
    setErrorMessage(null);
    setDeniedStatus(null);
    try {
      const data = await onLoadVideo(lesson.id);
      setVideo(data.video);
      setState('loaded');
    } catch (err) {
      setErrorMessage(err.friendlyMessage || 'Không thể tải video.');
      setDeniedStatus(err.status ?? null);
      setState('error');
    }
  }

  return (
    <article className="video-card">
      <div className="video-card-top">
        <div
          className="video-label"
          style={{
            backgroundColor: label.color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <LabelIcon size={12} />
          <span>{label.text}</span>
        </div>
        <div className="video-meta">
          <span>#{lesson.position}</span>
          <span>Google Drive</span>
        </div>
      </div>

      <h3 className="video-title">{lesson.title}</h3>
      {lesson.description && <p className="video-desc">{lesson.description}</p>}

      {state === 'loaded' && video?.embedUrl ? (
        <iframe
          className="video-frame"
          src={video.embedUrl}
          width="100%"
          height="360"
          allow="autoplay"
          allowFullScreen
          title={lesson.title}
        />
      ) : state === 'error' ? (
        <div className="video-blocked">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#dc2626' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0 }}>{errorMessage}</p>
          </div>
          <div className="video-blocked-actions">
            {deniedStatus === 403 && onRequestEnroll && (
              <button
                className="btn-primary"
                onClick={onRequestEnroll}
                type="button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <UserPlus size={14} /> Đăng ký khóa học
              </button>
            )}
            <button
              className="link-button"
              onClick={handleOpen}
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={14} /> Thử lại
            </button>
          </div>
        </div>
      ) : (
        <button
          className="video-thumb"
          onClick={handleOpen}
          type="button"
          disabled={state === 'loading'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {state === 'loading' ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Đang tải…</span>
            </>
          ) : (
            <>
              <Play size={20} />
              <span>Nhấn để xem video</span>
            </>
          )}
        </button>
      )}
    </article>
  );
}
