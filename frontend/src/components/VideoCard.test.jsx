import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoCard from './VideoCard.jsx';

const lesson = {
  id: 1,
  title: 'Bài 1',
  description: 'Giới thiệu',
  position: 1,
  accessType: 'FREE',
};

describe('VideoCard', () => {
  it('does not render an iframe before the user clicks to open it', () => {
    render(<VideoCard lesson={lesson} onLoadVideo={vi.fn()} />);
    expect(screen.queryByTitle('Bài 1')).not.toBeInTheDocument();
    expect(screen.getByText('Nhấn để xem video')).toBeInTheDocument();
  });

  it('renders the iframe with embedUrl only after clicking, and never eagerly', async () => {
    const onLoadVideo = vi.fn().mockResolvedValue({
      video: { embedUrl: 'https://drive.google.com/file/d/abc/preview' },
    });
    render(<VideoCard lesson={lesson} onLoadVideo={onLoadVideo} />);

    fireEvent.click(screen.getByText('Nhấn để xem video'));

    await waitFor(() => expect(onLoadVideo).toHaveBeenCalledWith(1));
    const iframe = await screen.findByTitle('Bài 1');
    expect(iframe).toHaveAttribute(
      'src',
      'https://drive.google.com/file/d/abc/preview',
    );
  });

  it('shows a friendly message instead of a raw error when access is denied (403)', async () => {
    const onLoadVideo = vi.fn().mockRejectedValue(
      Object.assign(new Error('Forbidden'), {
        friendlyMessage:
          'Bạn chưa có quyền xem video này — hãy đăng ký khóa học và chờ Admin xác nhận thanh toán.',
      }),
    );
    render(<VideoCard lesson={lesson} onLoadVideo={onLoadVideo} />);

    fireEvent.click(screen.getByText('Nhấn để xem video'));

    expect(
      await screen.findByText(/chưa có quyền xem video này/i),
    ).toBeInTheDocument();
    expect(screen.queryByTitle('Bài 1')).not.toBeInTheDocument();
  });

  it('shows a "Đăng ký khóa học" button when access is denied with 403', async () => {
    const onLoadVideo = vi.fn().mockRejectedValue(
      Object.assign(new Error('Forbidden'), {
        friendlyMessage: 'Bạn chưa có quyền xem video này.',
        status: 403,
      }),
    );
    const onRequestEnroll = vi.fn();
    render(
      <VideoCard
        lesson={lesson}
        onLoadVideo={onLoadVideo}
        onRequestEnroll={onRequestEnroll}
      />,
    );

    fireEvent.click(screen.getByText('Nhấn để xem video'));

    const enrollButton = await screen.findByText('Đăng ký khóa học');
    fireEvent.click(enrollButton);
    expect(onRequestEnroll).toHaveBeenCalledTimes(1);
  });

  it('does not show the enroll button for a 401 (just needs login, not enrollment)', async () => {
    const onLoadVideo = vi.fn().mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        friendlyMessage: 'Bạn cần đăng nhập để xem video này.',
        status: 401,
      }),
    );
    render(
      <VideoCard
        lesson={lesson}
        onLoadVideo={onLoadVideo}
        onRequestEnroll={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Nhấn để xem video'));

    await screen.findByText(/cần đăng nhập/i);
    expect(screen.queryByText('Đăng ký khóa học')).not.toBeInTheDocument();
  });
});
