import { useState } from 'react';
import * as api from '../api.js';

export default function PublicEnrollPage({ presetCourse, onDone }) {
  const [form, setForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    courseId: presetCourse?.id ?? '',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      setError(api.getApiErrorMessage(err, 'Đăng ký thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="card">
        <h2>Đăng ký thành công</h2>
        <p className="notice notice-info">
          Mã đăng ký: <strong>#{result.id}</strong> — trạng thái:{' '}
          <strong>{result.status}</strong>
        </p>
        <p>
          Vui lòng kiểm tra email <strong>{form.contactEmail}</strong> để nhận
          hướng dẫn thanh toán. Quyền xem video sẽ được kích hoạt sau khi Admin
          xác nhận đã nhận thanh toán — chưa xác nhận nghĩa là bạn{' '}
          <strong>chưa</strong> có quyền xem video trả phí.
        </p>
        <button className="btn-secondary" onClick={onDone} type="button">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Đăng ký khóa học trả phí</h2>
      <p className="hint">
        Không cần tài khoản. Sau khi đăng ký, bạn sẽ nhận email hướng dẫn
        chuyển khoản; Admin sẽ xác nhận và cấp quyền xem video bằng đúng Gmail
        bạn điền bên dưới.
      </p>
      <label>
        Họ và tên
        <input
          required
          value={form.contactName}
          onChange={(e) => update('contactName', e.target.value)}
        />
      </label>
      <label>
        Gmail dùng để học
        <input
          required
          type="email"
          value={form.contactEmail}
          onChange={(e) => update('contactEmail', e.target.value)}
        />
      </label>
      <label>
        Số điện thoại
        <input
          required
          value={form.contactPhone}
          onChange={(e) => update('contactPhone', e.target.value)}
        />
      </label>
      <label>
        ID khóa học
        <input
          required
          type="number"
          value={form.courseId}
          onChange={(e) => update('courseId', e.target.value)}
        />
      </label>
      {error && <p className="message message-error">{error}</p>}
      <button className="btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
      </button>
    </form>
  );
}
