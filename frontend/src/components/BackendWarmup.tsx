'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';

/**
 * Khoảng thời gian tối thiểu giữa 2 lần ping (5 phút).
 * Trong khoảng này, việc chuyển tab qua lại sẽ không tạo thêm request.
 */
const PING_INTERVAL_MS = 5 * 60 * 1000;

let lastPingAt = 0;
let inFlight: Promise<void> | null = null;

/**
 * Gọi nhẹ endpoint /health để đánh thức backend (Render) ngay khi người dùng
 * vừa mở web, thay vì phải chờ ở lần đăng nhập đầu tiên.
 *
 * - Dùng fetch thuần (không qua axios) để không kích hoạt interceptor auth.
 * - Bỏ qua mọi lỗi: đây chỉ là request "hâm nóng", không ảnh hưởng chức năng.
 * - keepalive giúp request vẫn được gửi khi người dùng chuyển trang ngay sau đó.
 */
export function pingBackend(): Promise<void> {
  if (inFlight) return inFlight;

  lastPingAt = Date.now();

  inFlight = fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    cache: 'no-store',
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Component không render gì, chỉ chạy ping khi ứng dụng vừa tải và khi người
 * dùng quay lại tab sau một thời gian dài (backend có thể đã ngủ lại).
 */
export default function BackendWarmup() {
  useEffect(() => {
    void pingBackend();

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastPingAt > PING_INTERVAL_MS
      ) {
        void pingBackend();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
