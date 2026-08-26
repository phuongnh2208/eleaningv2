import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BookOpen,
  Unlock,
  Lock,
  Coins,
  Play,
  UserPlus,
  Loader2,
  AlertCircle,
  Video,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import * as api from '../api.js';
import VideoCard from '../components/VideoCard.jsx';

const ACCESS_BADGE = { FREE: 'free', PAID: 'paid' };

export default function CoursesPage({
  isLoggedIn,
  onRequestEnroll,
  admin = false,
  selectedCourseId = null,
  onCourseSelected,
}) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [openCourseId, setOpenCourseId] = useState(selectedCourseId);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const lessonSectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getCourses(admin)
      .then((data) => {
        if (!cancelled) {
          setCourses(
            Array.isArray(data) ? data : data.data || data.items || []
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

  // Load user enrollments to know which courses are already registered
  useEffect(() => {
    if (!isLoggedIn) {
      setMyEnrollments([]);
      return;
    }
    let cancelled = false;
    api
      .getMyEnrollments()
      .then((data) => {
        if (!cancelled) {
          setMyEnrollments(Array.isArray(data) ? data : data.items || []);
        }
      })
      .catch(() => {
        if (!cancelled) setMyEnrollments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const openCourse = useCallback(
    async (courseId, shouldScroll = true) => {
      setOpenCourseId(courseId);
      if (onCourseSelected) onCourseSelected(courseId);
      setLessonsLoading(true);
      try {
        const data = await api.getLessons(courseId);
        setLessons(Array.isArray(data) ? data : data.items || []);
      } catch {
        setLessons([]);
      } finally {
        setLessonsLoading(false);
        if (shouldScroll) {
          setTimeout(() => {
            lessonSectionRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }, 120);
        }
      }
    },
    [onCourseSelected]
  );

  // Auto-open and scroll when selectedCourseId is provided from MyEnrollmentsPage
  useEffect(() => {
    if (selectedCourseId) {
      openCourse(selectedCourseId, true);
    }
  }, [selectedCourseId, openCourse]);

  const loadVideo = useCallback(async (lessonId) => {
    try {
      return await api.getLessonVideo(lessonId);
    } catch (err) {
      const status = api.getApiErrorStatus(err);
      const friendly =
        status === 401
          ? 'Bạn cần đăng nhập để xem video này.'
          : status === 403
            ? 'Bạn chưa có quyền xem video này — hãy đăng ký khóa học và chờ Admin xác nhận thanh toán.'
            : api.getApiErrorMessage(err, 'Không thể tải video.');
      const wrapped = new Error(friendly);
      wrapped.friendlyMessage = friendly;
      wrapped.status = status;
      throw wrapped;
    }
  }, []);

  if (loading) {
    return (
      <div
        className="loading-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Loader2 size={20} className="animate-spin" /> Đang tải khóa học...
      </div>
    );
  }
  if (loadError) {
    return (
      <div
        className="loading-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: '#dc2626',
        }}
      >
        <AlertCircle size={20} /> {loadError}
      </div>
    );
  }
  if (courses.length === 0) {
    return (
      <div
        className="loading-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <BookOpen size={20} /> Chưa có khóa học nào.
      </div>
    );
  }

  const openCourse_ = courses.find((c) => c.id === openCourseId);

  return (
    <div>
      <div className="course-grid">
        {courses.map((course) => {
          const isOpen = course.id === openCourseId;
          const enrollment = myEnrollments.find(
            (e) => e.courseId === course.id
          );
          const isEnrolled = !!enrollment;
          const isActive = enrollment?.status === 'ACTIVE';

          return (
            <article
              className={`course-card ${isOpen ? 'course-card-active' : ''}`}
              key={course.id}
              style={
                isOpen
                  ? {
                      borderColor: 'var(--accent-2)',
                      boxShadow: '0 8px 24px rgba(40, 77, 108, 0.18)',
                    }
                  : {}
              }
            >
              {course.thumbnailUrl && (
                <img
                  className="course-thumb"
                  src={course.thumbnailUrl}
                  alt=""
                />
              )}
              <div
                className={`badge badge-${ACCESS_BADGE[course.accessType] || 'free'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {course.accessType === 'FREE' ? (
                  <Unlock size={12} />
                ) : (
                  <Lock size={12} />
                )}
                {course.accessType}
              </div>
              <h3>{course.title}</h3>
              <p className="course-desc">{course.description}</p>
              {course.accessType === 'PAID' && course.price != null && (
                <p
                  className="course-price"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Coins size={15} />
                  {Number(course.price).toLocaleString('vi-VN')}{' '}
                  {course.currency || 'VND'}
                </p>
              )}
              <div
                className="course-card-actions"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <button
                  className={isOpen ? 'btn-secondary' : 'btn-primary'}
                  onClick={() => openCourse(course.id, true)}
                  type="button"
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Play size={14} />{' '}
                  {isOpen ? 'Đang học bài giảng ▼' : 'Xem khóa học'}
                </button>

                {course.accessType === 'PAID' &&
                  (isEnrolled ? (
                    <span
                      title={
                        isActive
                          ? 'Đã đăng ký và kích hoạt khóa học'
                          : 'Đã gửi đăng ký, đang chờ xác nhận thanh toán'
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        padding: '8px 12px',
                        borderRadius: '999px',
                        background: isActive
                          ? 'rgba(22, 163, 74, 0.12)'
                          : 'rgba(234, 88, 12, 0.12)',
                        color: isActive ? '#16a34a' : '#ea580c',
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                        border: `1px solid ${
                          isActive
                            ? 'rgba(22, 163, 74, 0.25)'
                            : 'rgba(234, 88, 12, 0.25)'
                        }`,
                      }}
                    >
                      {isActive ? (
                        <CheckCircle2 size={16} color="#16a34a" />
                      ) : (
                        <Clock size={16} color="#ea580c" />
                      )}
                      <span>{isActive ? 'Đã ĐK' : 'Chờ duyệt'}</span>
                    </span>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => onRequestEnroll(course)}
                      type="button"
                      title="Đăng ký khóa học"
                      aria-label="Đăng ký khóa học"
                      style={{
                        flexShrink: 0,
                        padding: '8px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <UserPlus size={16} />
                    </button>
                  ))}
              </div>
            </article>
          );
        })}
      </div>

      {openCourseId && (
        <section
          className="lesson-section"
          ref={lessonSectionRef}
          style={{
            marginTop: 28,
            padding: '24px',
            background: 'var(--panel-strong)',
            borderRadius: '20px',
            border: '2px solid rgba(40, 77, 108, 0.15)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              paddingBottom: 14,
              borderBottom: '1px solid var(--line)',
              marginBottom: 20,
            }}
          >
            <div>
              <span
                className="status-pill status-active"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                <Sparkles size={12} /> Đang mở khóa học
              </span>
              <h2
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: 0,
                  fontSize: 20,
                }}
              >
                <Video size={22} color="var(--accent-2)" />
                {openCourse_?.title || `Khóa học #${openCourseId}`}
              </h2>
            </div>

            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setOpenCourseId(null);
                if (onCourseSelected) onCourseSelected(null);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <X size={14} /> Thu gọn bài học
            </button>
          </div>

          {lessonsLoading ? (
            <div
              className="loading-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Loader2 size={18} className="animate-spin" /> Đang tải danh sách
              bài học và video...
            </div>
          ) : lessons.length === 0 ? (
            <div
              className="loading-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <BookOpen size={18} /> Khóa học này hiện chưa có bài học nào.
            </div>
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
                      openCourse_
                        ? () => onRequestEnroll(openCourse_)
                        : undefined
                    }
                  />
                ))}
            </div>
          )}

          {!isLoggedIn && (
            <p
              className="notice notice-warning"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 16,
              }}
            >
              <AlertCircle size={16} /> Đăng nhập để xem video bài học.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
