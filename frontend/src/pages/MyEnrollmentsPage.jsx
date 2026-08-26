import { useEffect, useState } from 'react';
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  Tag,
  Play,
  Coins,
  RefreshCw,
} from 'lucide-react';
import * as api from '../api.js';

const STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', class: 'status-pending', icon: Clock },
  ACTIVE: { label: 'Đã kích hoạt', class: 'status-active', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', class: 'status-cancelled', icon: XCircle },
  EXPIRED: { label: 'Hết hạn', class: 'status-expired', icon: AlertCircle },
};

export default function MyEnrollmentsPage({ currentUser, onGoToCourse }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
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

  if (loading) {
    return (
      <div className="loading-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Loader2 size={18} className="animate-spin" /> Đang tải danh sách khóa học của bạn...
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={22} color="var(--accent-2)" />
          <h2>Khóa học của tôi</h2>
        </div>
        <button
          type="button"
          className="filter-btn"
          onClick={load}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <RefreshCw size={13} /> Tải lại
        </button>
      </div>

      {error && <p className="message message-error">{error}</p>}

      {enrollments.length === 0 ? (
        <div className="loading-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '30px 20px' }}>
          <BookOpen size={28} color="var(--muted)" />
          <p style={{ margin: 0, fontWeight: 600 }}>Bạn chưa đăng ký khóa học nào.</p>
          <p className="hint" style={{ margin: 0, fontSize: 13 }}>
            Hãy vào tab "Khóa học" để chọn và đăng ký khóa học bạn yêu thích.
          </p>
        </div>
      ) : (
        <ul className="enrollment-list">
          {enrollments.map((en) => {
            const statusInfo = STATUS_MAP[en.status] || {
              label: en.status,
              class: 'status-pending',
              icon: Clock,
            };
            const StatusIcon = statusInfo.icon;
            const courseTitle = en.course?.title || `Khóa học #${en.courseId}`;

            return (
              <li key={en.id} className="enrollment-item" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                      <Tag size={13} /> Mã ĐK: #DK-{en.id}
                    </span>
                    <span
                      className={`status-pill ${statusInfo.class}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {courseTitle}
                  </div>

                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)' }}>
                    {en.payment?.amount && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Coins size={13} /> {Number(en.payment.amount).toLocaleString('vi-VN')} {en.payment.currency || 'VND'}
                      </span>
                    )}
                    <span>Ngày đăng ký: {new Date(en.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {en.status === 'ACTIVE' && onGoToCourse && (
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => onGoToCourse(en.courseId)}
                      type="button"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Play size={13} /> Vào học ngay
                    </button>
                  )}

                  {isAdmin && en.status === 'PENDING' && (
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => handleConfirm(en.id)}
                      disabled={confirmingId === en.id}
                      type="button"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {confirmingId === en.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      {confirmingId === en.id ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isAdmin && (
        <p className="hint" style={{ marginTop: 14 }}>
          Sau khi chuyển khoản thành công, Admin sẽ duyệt đơn đăng ký và kích hoạt quyền xem video cho bạn.
        </p>
      )}
    </div>
  );
}
