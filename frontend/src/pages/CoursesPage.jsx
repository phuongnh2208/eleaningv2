import { useEffect, useState, useCallback } from 'react';
import * as api from '../api.js';
import VideoCard from '../components/VideoCard.jsx';

const ACCESS_BADGE = { FREE: 'free', PAID: 'paid' };

export default function CoursesPage({ isLoggedIn, onRequestEnroll, admin = false }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [openCourseId, setOpenCourseId] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getCourses(admin)
      .then((data) => {
        if (!cancelled) {
          setCourses(
            Array.isArray(data) ? data : data.data || data.items || [],
          );
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Không thể tải danh sách khóa học.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [admin]);

  const openCourse = useCallback(async (courseId) => {
    setOpenCourseId(courseId);
    setLessonsLoading(true);
    try {
      const data = await api.getLessons(courseId);
      setLessons(Array.isArray(data) ? data : data.items || []);
    } catch {
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  }, []);

  const loadVideo = useCallback(
    async (lessonId) => {
      try {
        return await api.getLessonVideo(lessonId);
      } catch (err) {
        const status = api.getApiErrorStatus(err);
        const friendly =
          status === 401
            ? 'Bạn cần đăng nhập pour voir ce video.'
            : status === 403
              ? 'Bạn chưa a pas le droit à cette vidéo — hãy đăng ký khóa học et attendez Admin de confirmer le paiement.'
              : api.getApiErrorMessage(err, 'Không thể tải video.');
        const wrapped = new Error(friendly);
        wrapped.friendlyMessage = friendly;
        wrapped.status = status;
        throw wrapped;
      }
    },
    [],
  );

  if (loading) return <div className="loading-panel">Đang tải khóa học...</div>;
  if (loadError) return <div className="loading-panel">{loadError}</div>;
  if (courses.length === 0)
    return <div className="loading-panel">Chưa có khóa học nào.</div>;

  const openCourse_ = courses.find((c) => c.id === openCourseId);

  return (
    <div>
      <div className="course-grid">
        {courses.map((course) => (
          <article className="course-card" key={course.id}>
            {course.thumbnailUrl && (
              <img
                className="course-thumb"
                src={course.thumbnailUrl}
                alt=""
              />
            )}
            <div
              className={`badge badge-${ACCESS_BADGE[course.accessType] || 'free'}`}
            >
              {course.accessType}
            </div>
            <h3>{course.title}</h3>
            <p className="course-desc">{course.description}</p>
            {course.accessType === 'PAID' && course.price != null && (
              <p className="course-price">
                {course.price} {course.currency}
              </p>
            )}
            <div className="course-card-actions">
              <button
                className="btn-primary"
                onClick={() => openCourse(course.id)}
                type="button"
              >
                Xem khóa học
              </button>
              {course.accessType === 'PAID' && (
                <button
                  className="btn-secondary"
                  onClick={() => onRequestEnroll(course)}
                  type="button"
                >
                  Đăng ký khóa học
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {openCourseId && (
        <section className="lesson-section">
          <h2>Bài học · {openCourse_?.title}</h2>
          {lessonsLoading ? (
            <div className="loading-panel">Đang tải bài học...</div>
          ) : lessons.length === 0 ? (
            <div className="loading-panel">Khóa học chưa có bài học nào.</div>
          ) : (
            <div className="video-feed">
              {lessons
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((lesson) => (
                  <VideoCard
                    key={lesson.id}
                    lesson={lesson}
                    onLoadVideo={loadVideo}
                    onRequestEnroll={
                      openCourse_ ? () => onRequestEnroll(openCourse_) : undefined
                    }
                  />
                ))}
            </div>
          )}
          {!isLoggedIn && (
            <p className="notice notice-warning">
              Đăng nhập pour voir les vidéos des leçons.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
