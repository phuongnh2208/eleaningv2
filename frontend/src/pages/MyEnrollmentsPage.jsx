import { useEffect, useState } from 'react';
import * as api from '../api.js';

export default function MyEnrollmentsPage({ currentUser }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  function load() {
    setLoading(true);
    api
      .getMyEnrollments()
      .then((data) => setEnrollments(Array.isArray(data) ? data : data.items || []))
      .catch(() => setError('Không thể tải danh sách đăng ký.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleConfirm(id) {
    setConfirmingId(id);
    try {
      await api.confirmEnrollmentPayment(id);
      load();
    } catch (err) {
      setError(api.getApiErrorMessage(err, 'Xác nhận thất bại.'));
    } finally {
      setConfirmingId(null);
    }
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  if (loading) return <div className="loading-panel">Đang tải...</div>;

  return (
    <div className="card">
      <h2>Khóa học của tôi</h2>
      {error && <p className="message message-error">{error}</p>}
      {enrollments.length === 0 ? (
        <p className="loading-panel">Bạn chưa đăng ký khóa học nào.</p>
      ) : (
        <ul className="enrollment-list">
          {enrollments.map((en) => (
            <li key={en.id} className="enrollment-item">
              <div>
                <strong>#{en.id}</strong> — course #{en.courseId} —{' '}
                <span className={`status-pill status-${en.status?.toLowerCase()}`}>
                  {en.status}
                </span>
              </div>
              {isAdmin && en.status === 'PENDING' && (
                <button
                  className="btn-secondary"
                  onClick={() => handleConfirm(en.id)}
                  disabled={confirmingId === en.id}
                  type="button"
                >
                  {confirmingId === en.id ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!isAdmin && (
        <p className="hint">
          Chỉ Admin mới có thể xác nhận thanh toán để kích hoạt đăng ký.
        </p>
      )}
    </div>
  );
}
