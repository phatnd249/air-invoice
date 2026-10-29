# Mẫu Email Thông Báo & Nhắc Lịch Thanh Toán / Gia Hạn Hóa Đơn (Email Template)

Tài liệu này chuẩn hóa mẫu Email thông báo hóa đơn chính thức của Tetrasco / AI Robotic, được tham số hóa động để sử dụng trong **Module Delivery (Gửi Email)** của hệ thống **Invoice-AIR**.

---

## 1. Nội Dung Mẫu Email Chuẩn (Dynamic Template)

### 📌 Tiêu đề Email (Subject):
```
[Tetrasco] Thông báo hóa đơn & Nhắc lịch thanh toán dịch vụ - {{invoice.invoiceNumber}}
```

### 📄 Nội dung Email (HTML & Plaintext):

```text
Kính gửi Quý khách hàng {{buyer.name}},

Lời đầu tiên, Tetrasco xin chân thành cảm ơn Quý khách đã tin tưởng và đồng hành cùng các dịch vụ của chúng tôi trong suốt thời gian qua.

Chúng tôi xin gửi thông báo hóa đơn & nhắc lịch thanh toán cho dịch vụ mà Quý khách đang sử dụng để đảm bảo hoạt động luôn trong trạng thái ổn định nhất. Thông tin chi tiết:

• Dịch vụ: {{item.name}}
• Chi tiết / Tên miền: {{item.description}}
• Thời hạn: {{item.metaInfo}}
• Tổng tiền thanh toán: {{invoice.grandTotalFormatted}}
• Ngày đến hạn: {{invoice.dueDateFormatted}}

--------------------------------------------------
Tại sao Quý khách cần thanh toán đúng hạn?
Việc thanh toán / gia hạn kịp thời giúp Quý khách:
- Duy trì hoạt động liên tục 24/7 của hệ thống dịch vụ, website và email doanh nghiệp.
- Đảm bảo an toàn dữ liệu, tránh các rủi ro phát sinh khi dịch vụ bị gián đoạn.
- Giữ vững thứ hạng SEO và uy tín thương hiệu trên môi trường internet.
--------------------------------------------------

Hướng dẫn thanh toán & Xem hóa đơn:
Quý khách vui lòng kiểm tra chi tiết hóa đơn (kèm file PDF đính kèm trong email này) hoặc thực hiện thanh toán bằng cách truy cập trực tiếp vào đường dẫn dưới đây:

🔗 Xem & Thanh Toán Hóa Đơn Trực Tuyến: {{shareUrl}}

(Lưu ý: Quý khách có thể quét mã VietQR và kiểm tra cú pháp chuyển khoản được ghi sẵn trong hóa đơn để hoàn tất nhanh chóng).

Bên cạnh đó, Quý khách cũng có thể liên hệ để được hỗ trợ hoặc gửi biên lai trực tiếp qua: 
- Zalo: TetrasCo (0812305046)
- Hotline: 0812305046

Nếu Quý khách cần hỗ trợ kỹ thuật hoặc có bất kỳ thắc mắc nào, xin vui lòng phản hồi email này hoặc liên hệ hotline trên.

Trân trọng,
Đội ngũ Hỗ trợ khách hàng Tetrasco
```

---

## 2. Thiết Kế Giao Diện Email HTML Responsive

Trong hệ thống, email sẽ được gửi dưới dạng **HTML Email** sang trọng với nút bấm **"XEM HÓA ĐƠN TRỰC TUYẾN"** nổi bật và đính kèm file **PDF hóa đơn chính thức**.

---

## 3. Mẫu Email "Thanh Toán Thành Công + Bộ Tài Liệu & Hướng Dẫn"

- **File template:** `docs/email-templates/payment-success-documents.html`
- **Dùng cho:** `sendPaymentSuccessEmail()` trong `backend/src/delivery/delivery.service.ts`
- **Cấu trúc:** Header thương hiệu → Hero xác nhận thành công → Khối chi tiết thanh toán →
  Danh sách 3 tài liệu (hóa đơn PDF, biên lai, hướng dẫn) → Nút CTA mở bộ tài liệu →
  4 bước "Cách sử dụng" → Khối hỗ trợ → Footer.

### 3.1. Bảng placeholder

| Placeholder | Ý nghĩa | Ví dụ |
|---|---|---|
| `{{customerName}}` | Tên khách hàng | Nguyễn Văn An |
| `{{brandName}}` | Tên đơn vị / thương hiệu | Tetrasco |
| `{{invoiceNumber}}` | Mã hóa đơn | HD-000045 |
| `{{packageName}}` | Gói dịch vụ | Gói Hosting Business 1 năm |
| `{{grandTotal}}` | Số tiền đã thanh toán (đã format) | 1.500.000 ₫ |
| `{{paidAt}}` | Thời điểm thanh toán | 29/10/2026 10:20 |
| `{{documentsUrl}}` | **Link bộ tài liệu** (dùng chung cho mọi nút) | https://.../tai-lieu/HD-000045 |
| `{{supportZalo}}` | Số Zalo hỗ trợ | 0812305046 |
| `{{supportPhone}}` | Hotline | 0812305046 |
| `{{supportEmail}}` | Email hỗ trợ | billing@invoice.share4happy.com |
| `{{website}}` | Website | https://invoice.share4happy.com |

### 3.2. Quy ước thiết kế

- Toàn bộ CSS **inline**, layout bằng `<table>` → tương thích Gmail, Outlook, Apple Mail.
- Nút bấm dùng `<table>` + `padding` (không dùng `<button>`), kèm link dự phòng dạng text
  vì một số client chặn nút.
- Không dùng `flex`, `grid`, `position`, gradient → tránh lỗi hiển thị trên Outlook.
- Có preheader ẩn (phần tóm tắt hiển thị cạnh tiêu đề trong hộp thư).
- Media query `max-width: 600px` để giảm padding trên điện thoại.

### 3.3. Tích hợp vào code

Khi có link tài liệu thật, chỉ cần thay giá trị `htmlBody` trong `sendPaymentSuccessEmail()`
bằng nội dung file template và truyền các biến tương ứng; PDF biên lai vẫn đính kèm qua
`attachments` như hiện tại.
