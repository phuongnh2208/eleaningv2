import { useState } from 'react';

const ACCESS_LABELS = {
  FREE: { text: 'Video miễn phí — cần đăng nhập', color: '#4caf50' },
  PAID: { text: 'Video khóa học trả phí', color: '#ff9800' },
  INHERIT: { text: 'Theo khóa học', color: '#2196f3' },
};

// Video is fetched lazily (on click) so we never call the protected video
// endpoint — and never show an embedUrl/driveFileId — until the user asks.
export default function VideoCard({ lesson, onLoadVideo, onRequestEnroll }) {
  const [state, setState] = useState('idle'); // idle | loading | loaded | error
  const [video, setVideo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deniedStatus, setDeniedStatus] = useState(null);

  const label = ACCESS_LABELS[lesson.accessType] ?? {
    text: lesson.accessType,
    color: '#999',
  };

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
        <div className="video-label" style={{ backgroundColor: label.color }}>
          {label.text}
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
          <p>{errorMessage}</p>
          <div className="video-blocked-actions">
            {deniedStatus === 403 && onRequestEnroll && (
              <button
                className="btn-primary"
                onClick={onRequestEnroll}
                type="button"
              >
                Đăng ký khóa học
              </button>
            )}
            <button className="link-button" onClick={handleOpen} type="button">
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <button
          className="video-thumb"
          onClick={handleOpen}
          type="button"
          disabled={state === 'loading'}
        >
          <span className="play-icon">▶</span>
          <span>{state === 'loading' ? 'Đang tải…' : 'Nhấn để xem video'}</span>
        </button>
      )}
    </article>
  );
}
