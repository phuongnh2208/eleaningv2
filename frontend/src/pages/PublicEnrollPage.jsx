import { useState, useEffect } from "react";
import {
  UserPlus,
  CheckCircle2,
  BookOpen,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Send,
  Loader2,
  Coins,
  Tag,
  Clock,
} from "lucide-react";
import * as api from "../api.js";

const STATUS_DISPLAY = {
  PENDING: { label: "Chờ xác nhận thanh toán", class: "status-pending", icon: Clock },
  ACTIVE: { label: "Đã kích hoạt", class: "status-active", icon: CheckCircle2 },
};

export default function PublicEnrollPage({ presetCourse, onDone }) {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    courseId: presetCourse?.id ?? "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getCourses(false)
      .then((data) => {
        const all = Array.isArray(data) ? data : data.data || data.items || [];
        setCourses(all.filter((c) => c.accessType === "PAID"));
      })
      .catch(() => {});
  }, []);

  const selectedCourse = courses.find((c) => c.id === Number(form.courseId)) || presetCourse;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.createPublicEnrollment({
        ...form,
        courseId: Number(form.courseId),
      });
      setResult(data);
    } catch (err) {
      setError(api.getApiErrorMessage(err, "Đăng ký thất bại."));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const enrollment = result.enrollment || result;
    const enrollmentId = enrollment.id;
    const statusInfo = STATUS_DISPLAY[enrollment.status] || {
      label: enrollment.status || "Chờ xác nhận thanh toán",
      class: "status-pending",
      icon: Clock,
    };
    const StatusIcon = statusInfo.icon;

    return (
      <div className="card enroll-result-card">
        <div className="enroll-success-header" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={48} color="#16a34a" />
          <h2>Đăng ký khóa học thành công!</h2>
        </div>

        <div
          className="notice notice-info"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "16px 20px",
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <Tag size={16} /> Mã đăng ký: <strong>#{enrollmentId}</strong>
            </span>
            <span className={`status-pill ${statusInfo.class}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <StatusIcon size={13} /> {statusInfo.label}
            </span>
          </div>

          <div style={{ fontSize: 13, borderTop: "1px solid rgba(40, 77, 108, 0.15)", paddingTop: 8 }}>
            Khóa học: <strong>{selectedCourse?.title || `Khóa học #${enrollment.courseId}`}</strong>
            {selectedCourse?.price && (
              <span style={{ marginLeft: 10, color: "var(--accent)" }}>
                ({Number(selectedCourse.price).toLocaleString("vi-VN")} {selectedCourse.currency || "VND"})
              </span>
            )}
          </div>
        </div>

        <div className="enroll-next-steps">
          <h3>Các bước tiếp theo</h3>
          <ol className="steps-list">
            <li>
              <strong>Kiểm tra email</strong> <em>{form.contactEmail}</em>
              <br />
              Hệ thống đã tự động gửi email hướng dẫn gồm thông tin số tài khoản, số tiền và nội dung chuyển khoản chi tiết tới hộp thư của bạn.
            </li>
            <li>
              <strong>Chuyển khoản & Phản hồi xác nhận</strong>
              <br />
              Thực hiện thanh toán theo thông tin trong email, sau đó phản hồi lại email kèm ảnh chụp biên lai/giao dịch.
            </li>
            <li>
              <strong>Admin duyệt & Cấp quyền Gmail</strong>
              <br />
              Sau khi đối soát học phí, Admin sẽ kích hoạt khóa học và cấp quyền xem video Google Drive cho Gmail của bạn.
            </li>
            <li>
              <strong>Đăng nhập và bắt đầu học</strong>
              <br />
              Đăng nhập bằng đúng Gmail <em>{form.contactEmail}</em> để mở toàn bộ video bài học.
            </li>
          </ol>
        </div>

        <button
          className="btn-secondary"
          onClick={onDone}
          type="button"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}
        >
          <ArrowLeft size={16} /> Quay lại danh sách khóa học
        </button>
      </div>
    );
  }

  return (
    <form className="card enroll-form" onSubmit={handleSubmit}>
      <div className="enroll-form-header">
        <div className="card-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <UserPlus size={24} color="var(--accent-2)" />
        </div>
        <div>
          <h2>Đăng ký khóa học trả phí</h2>
          <p className="hint">Không cần tài khoản trước. Điền thông tin bên dưới để nhận hướng dẫn thanh toán và kích hoạt.</p>
        </div>
      </div>

      <label>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <BookOpen size={15} /> Khóa học muốn đăng ký
        </span>
        <select required value={form.courseId} onChange={(e) => update("courseId", e.target.value)}>
          <option value="">-- Chọn khóa học --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
              {c.price ? ` - ${Number(c.price).toLocaleString("vi-VN")} ${c.currency || "VND"}` : ""}
            </option>
          ))}
          {presetCourse && !courses.find((c) => c.id === presetCourse.id) && (
            <option value={presetCourse.id}>{presetCourse.title}</option>
          )}
        </select>
      </label>

      {selectedCourse?.price && (
        <div className="notice notice-info enroll-price-notice" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Coins size={16} />
          <span>
            Học phí: <strong>{Number(selectedCourse.price).toLocaleString("vi-VN")} {selectedCourse.currency || "VND"}</strong>
          </span>
        </div>
      )}

      <label>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <User size={15} /> Họ và tên
        </span>
        <input
          required
          value={form.contactName}
          onChange={(e) => update("contactName", e.target.value)}
          placeholder="Nguyễn Văn A"
        />
      </label>

      <label>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Mail size={15} /> Gmail dùng để học
        </span>
        <input
          required
          type="email"
          value={form.contactEmail}
          onChange={(e) => update("contactEmail", e.target.value)}
          placeholder="example@gmail.com"
        />
        <span className="hint">Dùng đúng Gmail này để đăng nhập và xem video sau khi được cấp quyền.</span>
      </label>

      <label>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Phone size={15} /> Số điện thoại
        </span>
        <input
          required
          value={form.contactPhone}
          onChange={(e) => update("contactPhone", e.target.value)}
          placeholder="0901234567"
        />
      </label>

      {error && <p className="message message-error">{error}</p>}

      <div className="enroll-form-actions">
        <button
          className="btn-secondary"
          type="button"
          onClick={onDone}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <button
          className="btn-primary"
          type="submit"
          disabled={submitting || !form.courseId}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {submitting ? "Đang gửi..." : "Gửi đăng ký"}
        </button>
      </div>
    </form>
  );
}
