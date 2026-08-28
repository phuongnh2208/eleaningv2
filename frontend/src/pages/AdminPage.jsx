import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlusCircle,
  BookOpen,
  ClipboardList,
  FolderSearch,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  Save,
  X,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Coins,
  Video,
  Check,
  RotateCcw,
  CheckSquare,
  Square,
  Sparkles,
  Clock,
  XCircle,
  Tag,
  Users,
  Shield,
  ShieldAlert,
  Ban,
  Search,
} from 'lucide-react';
import client, {
  getApiErrorMessage,
  getAdminCourses,
  updateCourse,
  deleteCourse,
  getAdminEnrollments,
  confirmEnrollmentPayment,
  cancelEnrollment,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getAdminCourseLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../api.js';

function isDriveFolderUrl(url) {
  return /drive\.google\.com\/(drive\/folders|open\?id=)/.test(url || '');
}
function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const ENROLLMENT_STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', pillClass: 'status-pending', icon: Clock },
  ACTIVE: { label: 'Đã kích hoạt', pillClass: 'status-active', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', pillClass: 'status-cancelled', icon: XCircle },
  EXPIRED: { label: 'Hết hạn', pillClass: 'status-expired', icon: AlertCircle },
};

/* ─── DriveFolderScanner ─────────────────────────────────────────── */
function DriveFolderScanner({ folderUrl, onFolderUrlChange, files, onFilesChange, existingFileIds = new Set() }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounce = useRef(null);

  useEffect(() => {
    if (!isDriveFolderUrl(folderUrl)) {
      onFilesChange([]);
      setError(null);
      return;
    }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => scan(folderUrl), 700);
    return () => clearTimeout(debounce.current);
  }, [folderUrl]);

  async function scan(url) {
    setError(null);
    setLoading(true);
    onFilesChange([]);
    try {
      const { data } = await client.get('/lessons/drive-folder', { params: { url } });
      if (!data.length) {
        setError('Thư mục không có video nào. Kiểm tra quyền Service Account.');
        return;
      }
      onFilesChange(
        data.map((f, i) => ({
          driveFileId: f.driveFileId,
          name: f.name,
          videoUrl: f.videoUrl,
          selected: existingFileIds.has(f.driveFileId) || !existingFileIds.size,
          isExisting: existingFileIds.has(f.driveFileId),
          title: f.name,
          position: i + 1,
          accessType: 'INHERIT',
          status: existingFileIds.has(f.driveFileId) ? 'existing' : null,
          error: null,
        }))
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không đọc được thư mục. Kiểm tra quyền Service Account.'));
    } finally {
      setLoading(false);
    }
  }

  function updateFile(idx, patch) {
    onFilesChange(files.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  return (
    <div className="drive-scanner">
      <label>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FolderSearch size={16} /> Link thư mục Google Drive
        </span>
        <div className="folder-url-row" style={{ marginTop: 6 }}>
          <input
            className="folder-url-input"
            value={folderUrl}
            onChange={(e) => onFolderUrlChange(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/FOLDER_ID"
            spellCheck={false}
          />
          {loading && (
            <span className="folder-scanning-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Loader2 size={14} className="animate-spin" /> Đang quét...
            </span>
          )}
          {!loading && files.length > 0 && (
            <span className="folder-ok-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={14} /> {files.length} video
            </span>
          )}
        </div>
      </label>

      {error && (
        <div className="message message-error drive-error-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <AlertCircle size={16} /> Lỗi: {error}
          </div>
          <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 12 }}>
            <li>Thư mục đã share với <code>elearning-drive-access@coral-airlock-498308-q5.iam.gserviceaccount.com</code>?</li>
            <li>Link đúng định dạng <code>drive.google.com/drive/folders/...</code>?</li>
          </ul>
        </div>
      )}

      {files.length > 0 && (
        <div className="drive-video-list">
          <div className="drive-video-list-header">
            <strong>
              Danh sách video ({files.filter((f) => f.selected).length}/{files.length} được chọn)
            </strong>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="filter-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => onFilesChange(files.map((f) => ({ ...f, selected: true })))}
              >
                <CheckSquare size={13} /> Chọn tất cả
              </button>
              <button
                type="button"
                className="filter-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => onFilesChange(files.map((f) => ({ ...f, selected: false })))}
              >
                <Square size={13} /> Bỏ tất cả
              </button>
            </div>
          </div>

          {files.map((f, i) => (
            <div
              key={f.driveFileId}
              className={[
                'drive-video-row',
                f.isExisting ? 'drive-video-existing' : '',
                f.status === 'done' ? 'drive-item-done' : f.status === 'error' ? 'drive-item-error' : '',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={f.selected}
                onChange={(e) => updateFile(i, { selected: e.target.checked })}
              />
              {f.isExisting && (
                <span className="existing-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Check size={12} /> Có sẵn
                </span>
              )}
              <input
                className="drive-folder-title"
                value={f.title}
                onChange={(e) => updateFile(i, { title: e.target.value })}
                placeholder="Tên bài học"
              />
              <input
                className="drive-folder-position"
                type="number"
                min="1"
                value={f.position}
                onChange={(e) => updateFile(i, { position: Number(e.target.value) })}
                title="Thứ tự bài học"
              />
              <select
                className="drive-access-select"
                value={f.accessType}
                onChange={(e) => updateFile(i, { accessType: e.target.value })}
              >
                <option value="INHERIT">INHERIT (Theo khóa)</option>
                <option value="FREE">FREE (Miễn phí)</option>
                <option value="PAID">PAID (Trả phí)</option>
              </select>

              {f.status === 'creating' && <Loader2 size={15} className="animate-spin" style={{ color: 'var(--accent)' }} />}
              {f.status === 'done' && <CheckCircle2 size={15} style={{ color: '#16a34a' }} />}
              {f.status === 'existing' && <span className="status-pill status-active" title="Đã có trong khóa học">●</span>}
              {f.status === 'error' && <AlertCircle size={15} style={{ color: '#dc2626' }} title={f.error} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tab 1: Tạo khóa học ─────────────────────────────────────────── */
function TabCreateCourse() {
  const [accessType, setAccessType] = useState('FREE');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseStatus, setCourseStatus] = useState('PUBLISHED');
  const [folderUrl, setFolderUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (files.length > 0 && !courseTitle) {
      const name = 'Khóa học ' + files.length + ' bài';
      setCourseTitle(name);
      setCourseSlug(slugify(name));
    }
  }, [files]);

  function updateFile(idx, patch) {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  async function handleCreate(e) {
    e.preventDefault();
    const sel = files.filter((f) => f.selected);
    if (!sel.length) {
      setError('Vui lòng chọn ít nhất 1 bài học.');
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const slug = courseSlug || slugify(courseTitle);
      const { data: course } = await client.post('/courses', {
        title: courseTitle,
        slug,
        description: courseDesc || undefined,
        driveFolderUrl: folderUrl || undefined,
        accessType,
        status: courseStatus,
        price: accessType === 'PAID' && coursePrice ? Number(coursePrice) : undefined,
        currency: accessType === 'PAID' ? 'VND' : undefined,
      });

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!f.selected) continue;
        updateFile(i, { status: 'creating' });
        try {
          await client.post('/courses/' + course.id + '/lessons', {
            title: f.title,
            position: f.position,
            accessType: f.accessType,
            isPublished: true,
            videoUrl: f.videoUrl,
          });
          updateFile(i, { status: 'done' });
        } catch (err) {
          updateFile(i, { status: 'error', error: getApiErrorMessage(err) });
        }
      }
      setResult(course);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Tạo khóa học thất bại.'));
    } finally {
      setCreating(false);
    }
  }

  function reset() {
    setResult(null);
    setFiles([]);
    setCourseTitle('');
    setCourseSlug('');
    setCourseDesc('');
    setCoursePrice('');
    setFolderUrl('');
    setError(null);
  }

  if (result) {
    return (
      <div className="admin-success-card">
        <CheckCircle2 size={40} style={{ color: '#16a34a', marginBottom: 8 }} />
        <h3>Tạo thành công khóa học #{result.id}</h3>
        <p>
          <strong>{result.title}</strong> — {result.accessType} — {result.status}
        </p>
        <button className="btn-secondary" onClick={reset} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <PlusCircle size={16} /> Tạo khóa học mới
        </button>
      </div>
    );
  }

  const selectedCount = files.filter((f) => f.selected).length;

  return (
    <div className="create-course-layout">
      <form className="card create-course-form" onSubmit={handleCreate}>
        <div className="card-header-row">
          <div className="card-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusCircle size={22} color="var(--accent-2)" />
          </div>
          <div>
            <h2>Tạo khóa học mới</h2>
            <p className="hint">Dán link thư mục Drive → hệ thống tự quét video → chọn bài học → tạo khóa học.</p>
          </div>
        </div>

        <div className="access-type-selector">
          <button
            type="button"
            className={'access-type-btn' + (accessType === 'FREE' ? ' active' : '')}
            onClick={() => setAccessType('FREE')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Unlock size={16} /> Miễn phí (FREE)
          </button>
          <button
            type="button"
            className={'access-type-btn' + (accessType === 'PAID' ? ' active' : '')}
            onClick={() => setAccessType('PAID')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Lock size={16} /> Trả phí (PAID)
          </button>
        </div>

        <label>
          Tên khóa học <span className="required-mark">*</span>
          <input
            required
            value={courseTitle}
            onChange={(e) => {
              setCourseTitle(e.target.value);
              if (!courseSlug) setCourseSlug(slugify(e.target.value));
            }}
            placeholder="VD: Lập trình NestJS từ cơ bản"
          />
        </label>
        <label>
          Slug (định danh URL)
          <input required value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)} placeholder="VD: nestjs-co-ban" />
        </label>
        <label>
          Mô tả khóa học
          <textarea
            value={courseDesc}
            onChange={(e) => setCourseDesc(e.target.value)}
            placeholder="Mô tả ngắn về nội dung khóa học..."
            rows={3}
          />
        </label>

        {accessType === 'PAID' && (
          <label>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Coins size={15} /> Học phí (VND) <span className="required-mark">*</span>
            </span>
            <input
              type="number"
              required
              value={coursePrice}
              onChange={(e) => setCoursePrice(e.target.value)}
              placeholder="VD: 500000"
            />
          </label>
        )}

        <label>
          Trạng thái
          <select value={courseStatus} onChange={(e) => setCourseStatus(e.target.value)}>
            <option value="PUBLISHED">PUBLISHED — Công khai ngay</option>
            <option value="DRAFT">DRAFT — Lưu nháp (ẩn)</option>
          </select>
        </label>

        <DriveFolderScanner folderUrl={folderUrl} onFolderUrlChange={setFolderUrl} files={files} onFilesChange={setFiles} />

        {error && <p className="message message-error">{error}</p>}

        <div className="step-actions">
          <button className="btn-secondary" type="button" onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={15} /> Làm lại
          </button>
          <button
            className="btn-primary btn-create-course"
            type="submit"
            disabled={creating || !courseTitle || !selectedCount}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {creating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang tạo...
              </>
            ) : selectedCount ? (
              <>
                <Sparkles size={16} /> Tạo khóa học + {selectedCount} bài học
              </>
            ) : (
              <>
                <PlusCircle size={16} /> Tạo khóa học
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Tab 2: Quản lý khóa học ─────────────────────────────────────── */
function TabManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getAdminCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : data.data || []))
      .catch((err) => setError(getApiErrorMessage(err, 'Không tải được danh sách.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
        <Loader2 size={18} className="animate-spin" /> Đang tải danh sách khóa học...
      </div>
    );
  }
  if (error) return <div className="card"><p className="message message-error">{error}</p></div>;

  return (
    <div className="course-manage-list">
      {courses.length === 0 && (
        <div className="card">
          <p className="hint" style={{ textAlign: 'center' }}>
            Chưa có khóa học nào. Tạo khóa học đầu tiên ở tab "Tạo khóa học".
          </p>
        </div>
      )}
      {courses.map((c) =>
        editingId === c.id ? (
          <CourseEditCard
            key={c.id}
            course={c}
            onDone={() => {
              setEditingId(null);
              load();
            }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <CourseListItem key={c.id} course={c} onEdit={() => setEditingId(c.id)} onDeleted={load} />
        )
      )}
    </div>
  );
}

function CourseListItem({ course, onEdit, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Xóa khóa học "' + course.title + '"? Tất cả bài học sẽ bị xóa theo. Không thể hoàn tác!')) return;
    setDeleting(true);
    try {
      await deleteCourse(course.id);
      onDeleted();
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Xóa thất bại.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card course-manage-item">
      <div>
        <div className="course-manage-info">
          <div className="course-manage-title">
            <strong>{course.title}</strong>
            <span
              className={'badge badge-' + (course.accessType === 'FREE' ? 'free' : 'paid')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              {course.accessType === 'FREE' ? <Unlock size={11} /> : <Lock size={11} />}
              {course.accessType}
            </span>
            <span className={'status-pill ' + (course.status === 'PUBLISHED' ? 'status-active' : 'status-pending')}>
              {course.status}
            </span>
          </div>
          <div className="course-manage-meta">
            <span>#{course.id}</span>
            {course.price && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Coins size={13} /> {Number(course.price).toLocaleString('vi-VN')} VND
              </span>
            )}
            <span>/{course.slug}</span>
          </div>
        </div>
        <div className="course-manage-actions">
          <button className="btn-secondary btn-sm" type="button" onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Pencil size={13} /> Sửa
          </button>
          <button className="btn-danger btn-sm" type="button" onClick={handleDelete} disabled={deleting} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonFormModal({ lesson, courseId, defaultPosition, onSaved, onClose }) {
  const isEditing = Boolean(lesson);
  const [title, setTitle] = useState(lesson?.title || '');
  const [position, setPosition] = useState(lesson?.position ?? defaultPosition ?? 1);
  const [accessType, setAccessType] = useState(lesson?.accessType || 'INHERIT');
  const [isPublished, setIsPublished] = useState(lesson ? lesson.isPublished : true);
  const [description, setDescription] = useState(lesson?.description || '');
  const [videoUrl, setVideoUrl] = useState('');
  const [removeVideo, setRemoveVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEditing) {
        await updateLesson(lesson.id, {
          title: title.trim(),
          position: Number(position),
          accessType,
          isPublished,
          description: description.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          removeVideo: removeVideo || undefined,
        });
      } else {
        await createLesson(courseId, {
          title: title.trim(),
          position: Number(position),
          accessType,
          isPublished,
          description: description.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, isEditing ? 'Cập nhật bài học thất bại.' : 'Thêm bài học thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '90%' }}>
        <div className="modal-header">
          <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <Pencil size={18} /> {isEditing ? `Sửa bài học: #${lesson.position}` : 'Thêm bài học mới'}
          </h3>
          <button type="button" className="btn-secondary btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {error && <p className="message message-error">{error}</p>}

          <div className="lesson-form-grid">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Tên bài học *
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bài 01 - Giới thiệu cú pháp Python"
                style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8 }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Thứ tự hiển thị (#) *
              <input
                required
                type="number"
                min="1"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8 }}
              />
            </label>
          </div>

          <div className="lesson-form-grid">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Quyền xem bài học
              <select
                value={accessType}
                onChange={(e) => setAccessType(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8 }}
              >
                <option value="INHERIT">INHERIT (Theo khóa học)</option>
                <option value="FREE">FREE (Xem miễn phí / Học thử)</option>
                <option value="PAID">PAID (Chỉ học viên trả phí)</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Trạng thái xuất bản
              <select
                value={isPublished ? 'PUBLISHED' : 'DRAFT'}
                onChange={(e) => setIsPublished(e.target.value === 'PUBLISHED')}
                style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8 }}
              >
                <option value="PUBLISHED">Xuất bản (Hiển thị)</option>
                <option value="DRAFT">Bản nháp (Ẩn)</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
            Link Google Drive Video {isEditing && (lesson.video || lesson.hasVideo) ? '(Để trống nếu giữ nguyên video)' : ''}
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/.../view"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8 }}
            />
          </label>

          {isEditing && (lesson.video || lesson.hasVideo) && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b91c1c', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={removeVideo}
                onChange={(e) => setRemoveVideo(e.target.checked)}
              />
              Gỡ bỏ video hiện tại khỏi bài học này
            </label>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
            Mô tả bài học (tùy chọn)
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung tóm tắt bài học..."
              style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8 }}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật bài học' : 'Thêm bài học')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CourseEditCard({ course, onDone, onCancel }) {
  const [form, setForm] = useState({
    title: course.title || '',
    slug: course.slug || '',
    description: course.description || '',
    thumbnailUrl: course.thumbnailUrl || '',
    driveFolderUrl: course.driveFolderUrl || '',
    accessType: course.accessType || 'FREE',
    status: course.status || 'PUBLISHED',
    price: course.price || '',
  });
  const [folderUrl, setFolderUrl] = useState(course.driveFolderUrl || '');
  const [driveFiles, setDriveFiles] = useState([]);
  const [existingLessons, setExistingLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingLessons, setAddingLessons] = useState(false);
  const [error, setError] = useState(null);
  const [modalLesson, setModalLesson] = useState(null); // { lesson: obj | null, open: bool }
  const [deletingLessonId, setDeletingLessonId] = useState(null);

  const fetchLessons = useCallback(() => {
    setLoadingLessons(true);
    getAdminCourseLessons(course.id)
      .then((data) => setExistingLessons(Array.isArray(data) ? data : []))
      .catch(() => setExistingLessons([]))
      .finally(() => setLoadingLessons(false));
  }, [course.id]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const existingFileIds = new Set(
    existingLessons.filter((l) => l.video && l.video.driveFileId).map((l) => l.video.driveFileId)
  );

  async function handleSaveInfo(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateCourse(course.id, {
        title: form.title,
        slug: form.slug,
        description: form.description || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        driveFolderUrl: form.driveFolderUrl || folderUrl || undefined,
        accessType: form.accessType,
        status: form.status,
        price: form.accessType === 'PAID' && form.price ? Number(form.price) : undefined,
        currency: form.accessType === 'PAID' ? 'VND' : undefined,
      });
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Lưu thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLesson(lesson) {
    if (!window.confirm(`Bạn có chắc muốn xóa bài học #${lesson.position} - "${lesson.title}"?`)) {
      return;
    }
    setDeletingLessonId(lesson.id);
    try {
      await deleteLesson(lesson.id);
      fetchLessons();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Xóa bài học thất bại.'));
    } finally {
      setDeletingLessonId(null);
    }
  }

  async function handleAddLessons() {
    const toAdd = driveFiles.filter((f) => f.selected && !f.isExisting);
    if (!toAdd.length) {
      setError('Không có bài học mới để thêm. Hãy chọn các video chưa có sẵn.');
      return;
    }
    setError(null);
    setAddingLessons(true);
    for (let i = 0; i < driveFiles.length; i++) {
      const f = driveFiles[i];
      if (!f.selected || f.isExisting) continue;
      setDriveFiles((prev) => prev.map((x, j) => (j === i ? { ...x, status: 'creating' } : x)));
      try {
        await client.post('/courses/' + course.id + '/lessons', {
          title: f.title,
          position: f.position,
          accessType: f.accessType,
          isPublished: true,
          videoUrl: f.videoUrl,
        });
        setDriveFiles((prev) => prev.map((x, j) => (j === i ? { ...x, status: 'done', isExisting: true } : x)));
      } catch (err) {
        setDriveFiles((prev) => prev.map((x, j) => (j === i ? { ...x, status: 'error', error: getApiErrorMessage(err) } : x)));
      }
    }
    setAddingLessons(false);
    fetchLessons();
  }

  const newToAddCount = driveFiles.filter((f) => f.selected && !f.isExisting).length;
  const maxPos = existingLessons.reduce((max, l) => Math.max(max, l.position || 0), 0);

  return (
    <div className="card course-edit-card">
      <div className="course-edit-card-header">
        <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Pencil size={16} /> Đang sửa: <em>{course.title}</em>
        </h3>
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <X size={14} /> Đóng
        </button>
      </div>
      <div className="course-edit-two-col">
        <form className="course-edit-info" onSubmit={handleSaveInfo}>
          <div className="access-type-selector" style={{ marginBottom: 8 }}>
            <button
              type="button"
              className={'access-type-btn' + (form.accessType === 'FREE' ? ' active' : '')}
              onClick={() => setForm((p) => ({ ...p, accessType: 'FREE' }))}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <Unlock size={14} /> FREE
            </button>
            <button
              type="button"
              className={'access-type-btn' + (form.accessType === 'PAID' ? ' active' : '')}
              onClick={() => setForm((p) => ({ ...p, accessType: 'PAID' }))}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <Lock size={14} /> PAID
            </button>
          </div>
          <label>
            Tên khóa học
            <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </label>
          <label>
            Slug
            <input required value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
          </label>
          <label>
            Link thư mục Google Drive cha (Folder URL)
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={form.driveFolderUrl}
              onChange={(e) => {
                const val = e.target.value;
                setForm((p) => ({ ...p, driveFolderUrl: val }));
                setFolderUrl(val);
              }}
            />
          </label>
          <label>
            Mô tả
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </label>
          {form.accessType === 'PAID' && (
            <label>
              Học phí (VND)
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="500000"
              />
            </label>
          )}
          <label>
            Trạng thái
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </label>
          {error && <p className="message message-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>

        <div className="course-edit-lessons">
          <div className="edit-lessons-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
              <strong>Bài học hiện có ({loadingLessons ? '...' : existingLessons.length} bài)</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={fetchLessons}
                  title="Tải lại danh sách bài học"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <RefreshCw size={12} className={loadingLessons ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  className="btn-primary btn-xs"
                  onClick={() => setModalLesson({ lesson: null, open: true })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <PlusCircle size={12} /> Thêm bài lẻ
                </button>
              </div>
            </div>

            {loadingLessons && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>
                <Loader2 size={14} className="animate-spin" /> Đang tải bài học...
              </div>
            )}
            {!loadingLessons && existingLessons.length > 0 && (
              <ul className="existing-lessons-list">
                {existingLessons
                  .sort((a, b) => a.position - b.position)
                  .map((l) => (
                    <li key={l.id} className="existing-lesson-item">
                      <div className="lesson-item-main">
                        <span className="drive-item-order">#{l.position}</span>
                        <span className="lesson-item-title" title={l.title}>{l.title}</span>
                        <div className="lesson-item-badges">
                          {l.video || l.hasVideo ? (
                            <span className="status-pill status-active" title="Có video" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Video size={11} /> Video
                            </span>
                          ) : (
                            <span className="status-pill status-cancelled" title="Chưa có video">
                              Chưa có video
                            </span>
                          )}
                          {l.accessType === 'FREE' && (
                            <span className="status-pill status-active" style={{ fontSize: 10, padding: '2px 6px' }}>
                              FREE
                            </span>
                          )}
                          {l.accessType === 'PAID' && (
                            <span className="status-pill status-pending" style={{ fontSize: 10, padding: '2px 6px' }}>
                              PAID
                            </span>
                          )}
                          {!l.isPublished && (
                            <span className="status-pill status-expired" style={{ fontSize: 10, padding: '2px 6px' }}>
                              Nháp
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="lesson-item-actions">
                        <button
                          type="button"
                          className="btn-icon-xs"
                          title="Sửa bài học"
                          onClick={() => setModalLesson({ lesson: l, open: true })}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-xs danger"
                          title="Xóa bài học"
                          disabled={deletingLessonId === l.id}
                          onClick={() => handleDeleteLesson(l)}
                        >
                          {deletingLessonId === l.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
            {!loadingLessons && existingLessons.length === 0 && <p className="hint">Chưa có bài học nào.</p>}
          </div>

          <div className="edit-drive-section">
            <strong>Thêm bài học từ thư mục Drive</strong>
            <p className="hint" style={{ fontSize: 12, marginTop: 2 }}>
              Dán link thư mục Drive — hệ thống sẽ quét và đánh dấu bài học đã có sẵn. Chọn video mới rồi nhấn thêm.
            </p>
            <DriveFolderScanner
              folderUrl={folderUrl}
              onFolderUrlChange={(val) => {
                setFolderUrl(val);
                setForm((p) => ({ ...p, driveFolderUrl: val }));
              }}
              files={driveFiles}
              onFilesChange={setDriveFiles}
              existingFileIds={existingFileIds}
            />
            {newToAddCount > 0 && (
              <div className="step-actions" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAddLessons}
                  disabled={addingLessons}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {addingLessons ? <Loader2 size={15} className="animate-spin" /> : <PlusCircle size={15} />}
                  {addingLessons ? 'Đang thêm...' : 'Thêm ' + newToAddCount + ' bài học mới'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalLesson?.open && (
        <LessonFormModal
          lesson={modalLesson.lesson}
          courseId={course.id}
          defaultPosition={maxPos + 1}
          onSaved={() => {
            setModalLesson(null);
            fetchLessons();
          }}
          onClose={() => setModalLesson(null)}
        />
      )}
    </div>
  );
}

/* ─── Tab 3: Quản lý đăng ký ──────────────────────────────────────── */
function TabEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [confirming, setConfirming] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getAdminEnrollments(filter === 'ALL' ? undefined : filter)
      .then((data) => setEnrollments(Array.isArray(data) ? data : data.data || []))
      .catch((err) => setError(getApiErrorMessage(err, 'Không tải được danh sách.')))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirm(id) {
    setConfirming(id);
    try {
      await confirmEnrollmentPayment(id);
      load();
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Xác nhận thất bại.'));
    } finally {
      setConfirming(null);
    }
  }

  async function handleCancel(id) {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn HỦY đăng ký này (do chưa nhận được chuyển khoản hoặc thông tin không hợp lệ)?'
      )
    ) {
      return;
    }
    setCancelling(id);
    try {
      await cancelEnrollment(id);
      load();
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Hủy đăng ký thất bại.'));
    } finally {
      setCancelling(null);
    }
  }

  const statusFilters = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'ACTIVE', label: 'Đã kích hoạt' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
        <Loader2 size={18} className="animate-spin" /> Đang tải danh sách đăng ký...
      </div>
    );
  }
  if (error) return <div className="card"><p className="message message-error">{error}</p></div>;

  return (
    <div className="card">
      <div className="card-header-row">
        <div className="card-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClipboardList size={22} color="var(--accent-2)" />
        </div>
        <div>
          <h2>Quản lý đăng ký học viên</h2>
          <p className="hint">Xác nhận thanh toán để cấp quyền xem video, hoặc Hủy đăng ký nếu không nhận được tiền.</p>
        </div>
      </div>

      <div className="filter-row">
        {statusFilters.map((s) => (
          <button
            key={s.value}
            type="button"
            className={'filter-btn' + (filter === s.value ? ' active' : '')}
            onClick={() => setFilter(s.value)}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          className="filter-btn"
          onClick={load}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <RefreshCw size={13} /> Tải lại
        </button>
      </div>

      <div className="enrollment-admin-list">
        {enrollments.length === 0 && (
          <p className="hint" style={{ textAlign: 'center' }}>
            Không có đăng ký nào ở trạng thái này.
          </p>
        )}
        {enrollments.map((e) => {
          const statusInfo = ENROLLMENT_STATUS_MAP[e.status] || {
            label: e.status,
            pillClass: 'status-pending',
            icon: Clock,
          };
          const StatusIcon = statusInfo.icon;

          return (
            <div key={e.id} className="enrollment-admin-item">
              <div className="enrollment-admin-info">
                <div className="enrollment-admin-header">
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 700,
                      color: 'var(--accent-2)',
                      background: 'rgba(40, 77, 108, 0.08)',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  >
                    <Tag size={13} /> Mã ĐK: #{e.id}
                  </span>
                  <span
                    className={`status-pill ${statusInfo.pillClass}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <StatusIcon size={12} />
                    {statusInfo.label}
                  </span>
                </div>
                <div className="enrollment-course-name">
                  {e.course ? e.course.title : 'Khóa học #' + e.courseId}
                </div>
                <div className="enrollment-admin-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <User size={13} /> {e.contactName}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={13} /> {e.contactEmail}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={13} /> {e.contactPhone}
                  </span>
                  {e.payment?.amount && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Coins size={13} /> {Number(e.payment.amount).toLocaleString('vi-VN')} {e.payment.currency || 'VND'}
                    </span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> {new Date(e.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              <div className="enrollment-admin-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {e.status === 'PENDING' && (
                  <>
                    <button
                      className="btn-primary btn-sm"
                      type="button"
                      disabled={confirming === e.id || cancelling === e.id}
                      onClick={() => handleConfirm(e.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {confirming === e.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Xác nhận & Cấp quyền
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      type="button"
                      disabled={confirming === e.id || cancelling === e.id}
                      onClick={() => handleCancel(e.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#dc2626',
                        color: '#ffffff',
                        border: '1px solid #dc2626',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      {cancelling === e.id ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                      Hủy / Từ chối
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tab 4: Quản lý người dùng ─────────────────────────────────── */
function TabUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (roleFilter !== 'ALL') params.role = roleFilter;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (search.trim()) params.search = search.trim();

    getAdminUsers(params)
      .then((res) => {
        setUsers(Array.isArray(res) ? res : res.data || []);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Không tải được danh sách người dùng.')))
      .finally(() => setLoading(false));
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleRole(user) {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Đổi quyền của tài khoản ${user.email} thành ${nextRole}?`)) return;
    setUpdatingId(user.id);
    try {
      await updateAdminUser(user.id, { role: nextRole });
      load();
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Đổi quyền thất bại.'));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleStatus(user) {
    const nextStatus = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    const actionName = nextStatus === 'BANNED' ? 'Khóa' : 'Mở khóa';
    if (!window.confirm(`${actionName} tài khoản ${user.email}?`)) return;
    setUpdatingId(user.id);
    try {
      await updateAdminUser(user.id, { status: nextStatus });
      load();
    } catch (err) {
      window.alert(getApiErrorMessage(err, `${actionName} tài khoản thất bại.`));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`Xóa vĩnh viễn tài khoản ${user.email}? Không thể hoàn tác!`)) return;
    setUpdatingId(user.id);
    try {
      await deleteAdminUser(user.id);
      load();
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Xóa tài khoản thất bại.'));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="card">
      <div className="card-header-row">
        <div className="card-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={22} color="var(--accent-2)" />
        </div>
        <div>
          <h2>Quản lý tài khoản người dùng</h2>
          <p className="hint">Xem danh sách, phân quyền Admin/Học viên, và khóa/mở khóa tài khoản.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', margin: '14px 0 16px' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email hoặc tên..."
            style={{ width: '100%', paddingLeft: 34 }}
          />
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff', fontSize: 13 }}
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="USER">Học viên (USER)</option>
          <option value="ADMIN">Quản trị (ADMIN)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff', fontSize: 13 }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
          <option value="BANNED">Đã khóa (BANNED)</option>
        </select>

        <button
          type="button"
          className="filter-btn"
          onClick={load}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <RefreshCw size={13} /> Tải lại
        </button>
      </div>

      {loading && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
          <Loader2 size={18} className="animate-spin" /> Đang tải danh sách người dùng...
        </div>
      )}
      {error && <p className="message message-error">{error}</p>}

      {!loading && (
        <div className="course-manage-list">
          {users.length === 0 && (
            <p className="hint" style={{ textAlign: 'center', padding: '20px 0' }}>
              Không tìm thấy tài khoản người dùng nào.
            </p>
          )}

          {users.map((u) => {
            const isUserAdmin = u.role === 'ADMIN';
            const isBanned = u.status === 'BANNED';

            return (
              <div key={u.id} className="card course-manage-item" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong>#{u.id} {u.email}</strong>
                      <span
                        className={`status-pill ${isUserAdmin ? 'status-active' : ''}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: isUserAdmin ? 'rgba(40, 77, 108, 0.15)' : '#eee',
                          color: isUserAdmin ? 'var(--accent-2)' : 'var(--text)',
                        }}
                      >
                        <Shield size={11} /> {u.role}
                      </span>
                      <span
                        className={`status-pill ${isBanned ? 'status-cancelled' : 'status-active'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {isBanned ? <Ban size={11} /> : <CheckCircle2 size={11} />}
                        {isBanned ? 'Đã khóa (BANNED)' : 'Hoạt động (ACTIVE)'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)' }}>
                      {u.name && <span>👤 Tên: {u.name}</span>}
                      {u.googleId && <span style={{ color: '#2563eb' }}>✓ Đã liên kết Google</span>}
                      <span>📅 Ngày tạo: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-secondary btn-sm"
                      type="button"
                      disabled={updatingId === u.id}
                      onClick={() => handleToggleRole(u)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Chuyển đổi quyền giữa USER và ADMIN"
                    >
                      <ShieldAlert size={13} /> {isUserAdmin ? 'Hạ xuống USER' : 'Nâng lên ADMIN'}
                    </button>

                    <button
                      className={`btn-sm ${isBanned ? 'btn-secondary' : 'btn-danger'}`}
                      type="button"
                      disabled={updatingId === u.id}
                      onClick={() => handleToggleStatus(u)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {isBanned ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                      {isBanned ? 'Mở khóa' : 'Khóa tài khoản'}
                    </button>

                    <button
                      className="btn-danger btn-sm"
                      type="button"
                      disabled={updatingId === u.id}
                      onClick={() => handleDeleteUser(u)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={13} /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main AdminPage ──────────────────────────────────────────────── */
export default function AdminPage() {
  const [tab, setTab] = useState('create');
  const tabs = [
    { id: 'create', label: 'Tạo khóa học', icon: PlusCircle },
    { id: 'manage', label: 'Quản lý khóa học', icon: BookOpen },
    { id: 'enrollments', label: 'Quản lý đăng ký', icon: ClipboardList },
    { id: 'users', label: 'Quản lý người dùng', icon: Users },
  ];
  return (
    <div className="admin-page">
      <div className="admin-tabs">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={'admin-tab-btn' + (tab === t.id ? ' active' : '')}
              type="button"
              onClick={() => setTab(t.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="admin-tab-content">
        {tab === 'create' && <TabCreateCourse />}
        {tab === 'manage' && <TabManageCourses />}
        {tab === 'enrollments' && <TabEnrollments />}
        {tab === 'users' && <TabUsers />}
      </div>
    </div>
  );
}

