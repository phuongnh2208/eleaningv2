import { useState } from 'react';
import client, { getApiErrorMessage } from '../api.js';

export default function AdminPage() {
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    description: '',
    accessType: 'FREE',
    price: '',
    status: 'DRAFT',
  });
  const [courseResult, setCourseResult] = useState(null);
  const [courseError, setCourseError] = useState(null);

  const [lessonForm, setLessonForm] = useState({
    courseId: '',
    title: '',
    position: '',
    accessType: 'INHERIT',
    isPublished: true,
    videoUrl: '',
  });
  const [lessonResult, setLessonResult] = useState(null);
  const [lessonError, setLessonError] = useState(null);

  // --- Bulk import lessons from a Google Drive folder ---
  const [folderCourseId, setFolderCourseId] = useState('');
  const [folderUrl, setFolderUrl] = useState('');
  const [folderFiles, setFolderFiles] = useState([]); // [{driveFileId, name, videoUrl, selected, title, position, accessType, status}]
  const [folderLoading, setFolderLoading] = useState(false);
  const [folderError, setFolderError] = useState(null);
  const [folderCreating, setFolderCreating] = useState(false);

  async function submitCourse(e) {
    e.preventDefault();
    setCourseError(null);
    try {
      const body = {
        title: courseForm.title,
        slug: courseForm.slug,
        description: courseForm.description || undefined,
        accessType: courseForm.accessType,
        status: courseForm.status,
      };
      if (courseForm.price) body.price = Number(courseForm.price);
      const { data } = await client.post('/courses', body);
      setCourseResult(data);
      // Prefill the folder-import panel with the course we just created —
      // this is exactly the "tạo khóa học → gắn link Drive → thêm bài học"
      // flow the admin asked for.
      setFolderCourseId(String(data.id));
    } catch (err) {
      setCourseError(getApiErrorMessage(err, 'Tạo khóa học thất bại.'));
    }
  }

  async function submitLesson(e) {
    e.preventDefault();
    setLessonError(null);
    try {
      const body = {
        title: lessonForm.title,
        position: Number(lessonForm.position),
        accessType: lessonForm.accessType,
        isPublished: lessonForm.isPublished,
        videoUrl: lessonForm.videoUrl || undefined,
      };
      const { data } = await client.post(
        `/courses/${lessonForm.courseId}/lessons`,
        body,
      );
      setLessonResult(data);
    } catch (err) {
      setLessonError(getApiErrorMessage(err, 'Tạo bài học thất bại.'));
    }
  }

  async function loadDriveFolder(e) {
    e.preventDefault();
    setFolderError(null);
    setFolderLoading(true);
    setFolderFiles([]);
    try {
      const { data } = await client.get('/lessons/drive-folder', {
        params: { url: folderUrl },
      });
      setFolderFiles(
        data.map((file, index) => ({
          ...file,
          selected: true,
          title: file.name,
          position: index + 1,
          accessType: 'INHERIT',
          status: null, // null | 'creating' | 'done' | 'error'
          error: null,
        })),
      );
    } catch (err) {
      setFolderError(
        getApiErrorMessage(err, 'Không đọc được thư mục Drive.'),
      );
    } finally {
      setFolderLoading(false);
    }
  }

  function updateFolderFile(index, patch) {
    setFolderFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  async function createSelectedLessons() {
    setFolderCreating(true);
    for (let i = 0; i < folderFiles.length; i += 1) {
      const file = folderFiles[i];
      if (!file.selected || file.status === 'done') continue;
      updateFolderFile(i, { status: 'creating', error: null });
      try {
        await client.post(`/courses/${folderCourseId}/lessons`, {
          title: file.title,
          position: Number(file.position),
          accessType: file.accessType,
          isPublished: true,
          videoUrl: file.videoUrl,
        });
        updateFolderFile(i, { status: 'done' });
      } catch (err) {
        updateFolderFile(i, {
          status: 'error',
          error: getApiErrorMessage(err, 'Tạo bài học thất bại.'),
        });
      }
    }
    setFolderCreating(false);
  }

  return (
    <div className="admin-grid">
      <form className="card" onSubmit={submitCourse}>
        <h2>1. Tạo khóa học</h2>
        <label>
          Tiêu đề
          <input
            required
            value={courseForm.title}
            onChange={(e) =>
              setCourseForm((p) => ({ ...p, title: e.target.value }))
            }
          />
        </label>
        <label>
          Slug (duy nhất)
          <input
            required
            value={courseForm.slug}
            onChange={(e) =>
              setCourseForm((p) => ({ ...p, slug: e.target.value }))
            }
          />
        </label>
        <label>
          Mô tả
          <textarea
            value={courseForm.description}
            onChange={(e) =>
              setCourseForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </label>
        <div className="row-inline">
          <label>
            Loại
            <select
              value={courseForm.accessType}
              onChange={(e) =>
                setCourseForm((p) => ({ ...p, accessType: e.target.value }))
              }
            >
              <option value="FREE">FREE</option>
              <option value="PAID">PAID</option>
            </select>
          </label>
          <label>
            Giá
            <input
              type="number"
              value={courseForm.price}
              onChange={(e) =>
                setCourseForm((p) => ({ ...p, price: e.target.value }))
              }
            />
          </label>
          <label>
            Trạng thái
            <select
              value={courseForm.status}
              onChange={(e) =>
                setCourseForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </label>
        </div>
        {courseError && <p className="message message-error">{courseError}</p>}
        {courseResult && (
          <p className="message message-success">
            Đã tạo khóa học #{courseResult.id} — tiếp tục ở khung bên phải để
            nhập bài học từ thư mục Drive.
          </p>
        )}
        <button className="btn-primary" type="submit">
          Tạo khóa học
        </button>
      </form>

      <form className="card" onSubmit={loadDriveFolder}>
        <h2>2. Nhập bài học từ thư mục Google Drive</h2>
        <p className="hint">
          Dán link thư mục Drive chứa các video của khóa học (vd thư mục
          &quot;Courses 1&quot;) — hệ thống sẽ liệt kê từng video trong đó để
          bạn chọn tạo thành bài học, thay vì copy link từng file một.
        </p>
        <label>
          ID khóa học
          <input
            required
            type="number"
            value={folderCourseId}
            onChange={(e) => setFolderCourseId(e.target.value)}
          />
        </label>
        <label>
          Link thư mục Google Drive
          <input
            required
            placeholder="https://drive.google.com/drive/folders/FOLDER_ID"
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
          />
        </label>
        <div className="hint drive-sharing-hint">
          <strong>Yêu cầu:</strong>
          <p>
            Cần cấu hình <code>GOOGLE_SERVICE_ACCOUNT_KEY_PATH</code> ở
            backend, và thư mục Drive này phải được chia sẻ cho email service
            account (tối thiểu quyền Viewer để đọc danh sách; Editor nếu bài
            học là PAID để hệ thống cấp quyền theo từng học viên) — xem README
            mục 5.1.
          </p>
        </div>
        <button className="btn-secondary" type="submit" disabled={folderLoading}>
          {folderLoading ? 'Đang tải...' : 'Tải danh sách video'}
        </button>
        {folderError && <p className="message message-error">{folderError}</p>}

        {folderFiles.length > 0 && (
          <div className="drive-folder-list">
            {folderFiles.map((file, index) => (
              <div className="drive-folder-item" key={file.driveFileId}>
                <input
                  type="checkbox"
                  checked={file.selected}
                  onChange={(e) =>
                    updateFolderFile(index, { selected: e.target.checked })
                  }
                />
                <input
                  className="drive-folder-title"
                  value={file.title}
                  onChange={(e) =>
                    updateFolderFile(index, { title: e.target.value })
                  }
                />
                <input
                  className="drive-folder-position"
                  type="number"
                  value={file.position}
                  onChange={(e) =>
                    updateFolderFile(index, { position: e.target.value })
                  }
                />
                <select
                  value={file.accessType}
                  onChange={(e) =>
                    updateFolderFile(index, { accessType: e.target.value })
                  }
                >
                  <option value="INHERIT">INHERIT</option>
                  <option value="FREE">FREE</option>
                  <option value="PAID">PAID</option>
                </select>
                {file.status === 'creating' && (
                  <span className="status-pill">Đang tạo...</span>
                )}
                {file.status === 'done' && (
                  <span className="status-pill status-active">Đã tạo</span>
                )}
                {file.status === 'error' && (
                  <span className="status-pill status-expired" title={file.error}>
                    Lỗi
                  </span>
                )}
              </div>
            ))}
            <button
              className="btn-primary"
              type="button"
              onClick={createSelectedLessons}
              disabled={folderCreating || !folderCourseId}
            >
              {folderCreating
                ? 'Đang tạo bài học...'
                : 'Tạo bài học cho các video đã chọn'}
            </button>
          </div>
        )}
      </form>

      <form className="card" onSubmit={submitLesson}>
        <h2>Hoặc: tạo 1 bài học từ 1 link video Drive</h2>
        <div className="row-inline">
          <label>
            ID khóa học
            <input
              required
              type="number"
              value={lessonForm.courseId}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, courseId: e.target.value }))
              }
            />
          </label>
          <label>
            Vị trí
            <input
              required
              type="number"
              value={lessonForm.position}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, position: e.target.value }))
              }
            />
          </label>
        </div>
        <label>
          Tiêu đề bài học
          <input
            required
            value={lessonForm.title}
            onChange={(e) =>
              setLessonForm((p) => ({ ...p, title: e.target.value }))
            }
          />
        </label>
        <label>
          Loại truy cập bài học
          <select
            value={lessonForm.accessType}
            onChange={(e) =>
              setLessonForm((p) => ({ ...p, accessType: e.target.value }))
            }
          >
            <option value="INHERIT">INHERIT (theo loại khóa học)</option>
            <option value="FREE">FREE (miễn phí — cần đăng nhập)</option>
            <option value="PAID">PAID (trả phí — cần enrollment ACTIVE)</option>
          </select>
        </label>
        <label>
          Link Google Drive
          <input
            placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
            value={lessonForm.videoUrl}
            onChange={(e) =>
              setLessonForm((p) => ({ ...p, videoUrl: e.target.value }))
            }
          />
        </label>
        <div className="hint drive-sharing-hint">
          <strong>Cách chia sẻ file Drive tương ứng:</strong>
          {lessonForm.accessType === 'PAID' ? (
            <p>
              Bài học <strong>PAID</strong>: đặt file Drive ở chế độ{' '}
              <strong>Restricted</strong> và chia sẻ folder cho email service
              account (quyền Editor). Hệ thống sẽ tự cấp quyền xem cho đúng
              Gmail của học viên khi Admin xác nhận thanh toán — xem README
              mục 5.1.
            </p>
          ) : lessonForm.accessType === 'FREE' ? (
            <p>
              Bài học <strong>FREE</strong>: chỉ cần đặt file Drive ở chế độ{' '}
              <strong>&quot;Anyone with the link&quot;</strong>. Backend đã
              yêu cầu đăng nhập trước khi trả embedUrl, không cần cấp quyền
              Drive riêng cho từng người.
            </p>
          ) : (
            <p>
              Bài học <strong>INHERIT</strong>: áp dụng đúng quy tắc chia sẻ
              của loại khóa học (FREE → &quot;Anyone with the link&quot;;
              PAID → Restricted + service account).
            </p>
          )}
        </div>
        {lessonError && <p className="message message-error">{lessonError}</p>}
        {lessonResult && (
          <p className="message message-success">
            Đã tạo bài học #{lessonResult.id}
          </p>
        )}
        <button className="btn-primary" type="submit">
          Tạo bài học
        </button>
      </form>
    </div>
  );
}
