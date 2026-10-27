# KẾ HOẠCH THỰC HIỆN DỰ ÁN (INVOICE-AIR)

Hệ thống: **Tạo & Quản lý Hóa đơn (Invoice Generator / Manager)**  
Thời lượng dự kiến: **10 Tuần (MVP)**

---

## 1. Mục Tiêu Dự Án
Xây dựng và bàn giao phiên bản MVP của hệ thống hóa đơn theo phạm vi đã thống nhất (6 module: **Invoice, Document, Template, Delivery, Settings, Account**), sẵn sàng đưa vào sử dụng thực tế.

---

## 2. Nguyên Tắc Triển Khai
1. **Chốt phạm vi (Scope) & Thiết kế**: Trước khi code, tránh phát sinh tính năng giữa chừng.
2. **Triển khai theo Module**: Làm xong module nào demo ngay module đó.
3. **Ưu tiên luồng cốt lõi**: `Tạo → Xem (Preview) → Xuất (PDF/In) → Gửi (Email/Link)`.
4. **Kỷ luật về Scope MVP**: Không thêm tính năng ngoài phạm vi (Kho hàng, POS, CRM, Báo cáo công nợ).

---

## 3. Các Giai Đoạn Triển Khai Chi Tiết (10 Giai Đoạn)

### Giai đoạn 0 — Xác nhận & Thiết kế (Tuần 1)
* Thống nhất tài liệu tính năng & flow với khách hàng.
* Thiết kế wireframe / UI các màn hình chính: Danh sách hóa đơn, Tạo hóa đơn (split preview realtime), Cài đặt.
* Chốt công nghệ sử dụng (Next.js, NestJS, SQLite/Prisma, Playwright, Cloudflare R2, SMTP/Resend).

### Giai đoạn 1 — Setup Dự án & Hạ tầng (Tuần 1 - 2)
* Khởi tạo cấu trúc monorepo: `frontend/` (Next.js), `backend/` (NestJS), `packages/types/`, `packages/validation/`.
* Thiết lập database schema Prisma (Invoice, InvoiceItem, Settings, User, Template).
* Thiết lập môi trường dev, kết nối Cloudflare R2 & biến môi trường.
* Xây dựng module xác thực (Auth: Login, Refresh token).

### Giai đoạn 2 — Module Invoice: Tạo & Quản lý (Tuần 2 - 4)
* Form nhập hóa đơn: Người bán, Người mua, Bảng hàng hóa dịch vụ (kèm thời hạn `Từ ngày - Đến ngày`).
* Đánh số hóa đơn tự động (theo định dạng cấu hình `HD-{YYYY}-{NUMBER}`).
* Cơ chế lưu nháp tự động (Autosave).
* Danh sách hóa đơn: Tìm kiếm, lọc theo trạng thái (DRAFT, ISSUED, SENT), phân trang.
* Các thao tác: Chỉnh sửa nháp, sao chép (clone), hủy, xóa bản nháp.

### Giai đoạn 3 — Module Document: Preview / PDF / In (Tuần 4 - 6)
* Màn hình xem trước (Preview) realtime ngay khi nhập liệu form.
* Xuất PDF theo khổ chuẩn A4, A5 (sử dụng Playwright render HTML pixel-perfect).
* Chức năng in trực tiếp với print preview.

### Giai đoạn 4 — Module Template (Tuần 5 - 6, làm song song)
* Xây dựng các mẫu hóa đơn mặc định (trong đó có mẫu `standard-classic` Midnight Blue kèm mã VietQR SePay).
* Cho phép chọn mẫu khi tạo/xem hóa đơn.
* Tự động gắn Logo & thông tin doanh nghiệp vào mẫu.

### Giai đoạn 5 — Module Settings (Tuần 6 - 7)
* Cài đặt thông tin doanh nghiệp mặc định (Tên, MST, Địa chỉ, SĐT, Logo).
* Cài đặt thông tin tài khoản ngân hàng & cấu hình sinh VietQR.
* Cấu hình quy tắc đánh số hóa đơn, thuế mặc định, tiền tệ.

### Giai đoạn 6 — Module Delivery (Tuần 7 - 8)
* Gửi hóa đơn qua Email kèm file PDF đính kèm (hỗ trợ gửi từng đơn và gửi hàng loạt).
* Tạo link chia sẻ trực tuyến (Share link / Public token) để khách xem không cần đăng nhập.
* Tự động chuyển trạng thái: `Nháp (DRAFT) → Đã phát hành (ISSUED) → Đã gửi (SENT)`.

### Giai đoạn 7 — Lịch sử thay đổi (Tuần 6 - 8, làm song song)
* Ghi log đơn giản các mốc: Tạo hóa đơn, Sửa giá/số lượng, Phát hành, Gửi email.
* Hiển thị timeline lịch sử tại màn hình chi tiết hóa đơn.

### Giai đoạn 8 — Kiểm thử QA (Tuần 8 - 9)
* Kiểm thử chức năng theo checklist từng module.
* Kiểm thử trường hợp biên: Nhiều dòng hàng hóa, số tiền lớn, đổi định dạng tiền tệ.
* Kiểm thử render PDF & in ấn trên các thiết bị và trình duyệt khác nhau.

### Giai đoạn 9 — UAT cùng Khách Hàng (Tuần 9)
* Khách hàng thao tác trực tiếp trên môi trường staging.
* Ghi nhận phản hồi và fix các vấn đề phát sinh trong phạm vi MVP.

### Giai đoạn 10 — Triển Khai & Bàn Giao (Tuần 10)
* Deploy lên môi trường Production (VPS, Docker, Nginx).
* Khởi tạo dữ liệu ban đầu, hướng dẫn sử dụng và bàn giao tài liệu kỹ thuật.

---

## 4. Các Mốc Quan Trọng (Milestones)

| Mốc | Nội Dung | Thời Điểm |
| :--- | :--- | :--- |
| **M1** | Chốt scope & thiết kế giao diện (UI/UX) | Cuối Tuần 1 |
| **M2** | Demo Module Invoice (Tạo / Quản lý hóa đơn) | Cuối Tuần 4 |
| **M3** | Demo Module Document + Template (Preview realtime / Xuất PDF / Mẫu) | Cuối Tuần 6 |
| **M4** | Demo luồng hoàn chỉnh: Tạo → Xuất PDF → Gửi Email & Link | Cuối Tuần 8 |
| **M5** | Hoàn tất UAT, Khách hàng nghiệm thu | Cuối Tuần 9 |
| **M6** | **Go-live / Bàn giao chính thức** | Cuối Tuần 10 |
