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
} from 'lucide-react';
import client, {
  getApiErrorMessage,
  getAdminCourses,
  updateCourse,
  deleteCourse,
  getAdminEnrollments,
  confirmEnrollmentPayment,
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

function CourseEditCard({ course, onDone, onCancel }) {
  const [form, setForm] = useState({
    title: course.title || '',
    slug: course.slug || '',
    description: course.description || '',
    accessType: course.accessType || 'FREE',
    status: course.status || 'PUBLISHED',
    price: course.price || '',
  });
  const [folderUrl, setFolderUrl] = useState('');
  const [driveFiles, setDriveFiles] = useState([]);
  const [existingLessons, setExistingLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingLessons, setAddingLessons] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    client
      .get('/courses/' + course.id + '/lessons')
      .then(({ data }) => setExistingLessons(Array.isArray(data) ? data : []))
      .catch(() => setExistingLessons([]))
      .finally(() => setLoadingLessons(false));
  }, [course.id]);

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
  }

  const newToAddCount = driveFiles.filter((f) => f.selected && !f.isExisting).length;

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
            <strong>Bài học hiện có ({loadingLessons ? '...' : existingLessons.length} bài)</strong>
            {loadingLessons && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
                <Loader2 size={14} className="animate-spin" /> Đang tải bài học...
              </div>
            )}
            {!loadingLessons && existingLessons.length > 0 && (
              <ul className="existing-lessons-list">
                {existingLessons
                  .sort((a, b) => a.position - b.position)
                  .map((l) => (
                    <li key={l.id} className="existing-lesson-item">
                      <span className="drive-item-order">#{l.position}</span>
                      <span>{l.title}</span>
                      {l.video ? (
                        <span className="status-pill status-active" title="Có video" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Video size={12} /> Video
                        </span>
                      ) : (
                        <span className="status-pill status-cancelled" title="Chưa có video">
                          Chưa có video
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            )}
            {!loadingLessons && existingLessons.length === 0 && <p className="hint">Chưa có bài học nào.</p>}
          </div>

          <div className="edit-drive-section">
            <strong>Thêm bài học từ thư mục Drive</strong>
            <p className="hint" style={{ fontSize: 12, marginTop: 2 }}>
              Dán lại link thư mục Drive — hệ thống sẽ quét và đánh dấu bài học đã có sẵn. Chọn video mới rồi nhấn thêm.
            </p>
            <DriveFolderScanner
              folderUrl={folderUrl}
              onFolderUrlChange={setFolderUrl}
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
          <p className="hint">Xác nhận thanh toán để kích hoạt quyền xem video cho học viên.</p>
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
              <div className="enrollment-admin-actions">
                {e.status === 'PENDING' && (
                  <button
                    className="btn-primary btn-sm"
                    type="button"
                    disabled={confirming === e.id}
                    onClick={() => handleConfirm(e.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    {confirming === e.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Xác nhận & Cấp quyền
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
      </div>
    </div>
  );
}
