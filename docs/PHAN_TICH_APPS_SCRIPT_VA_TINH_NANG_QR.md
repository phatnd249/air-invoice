# Phân Tích Logic Tạo Hóa Đơn Từ Google Apps Script & Đề Xuất Nâng Cấp Hệ Thống

Tài liệu này phân tích chi tiết mã nguồn Google Apps Script (GAS) quản lý & tạo hóa đơn trước đây của người dùng, từ đó rút ra các logic cốt lõi và đề xuất kiến trúc/tính năng cho hệ thống **Invoice-AIR** mới (Next.js + NestJS).

---

## I. Phân Tích Logic Đoạn Code Google Apps Script

### 1. Phân hệ Gửi Email (`guiEmailTuDong`)
* **Nguồn dữ liệu**: Đọc dữ liệu từ sheet theo hàng (bắt đầu từ dòng thứ 3).
* **Các trường dữ liệu**:
  * Email người nhận (`emailNhan`)
  * Tiêu đề email (`tieuDe`)
  * Nội dung email (`noiDung`)
  * Trạng thái gửi (`trangThai`)
  * Checkbox xác nhận gửi (`chonGui`)
* **Xử lý**:
  * Điều kiện gửi: `chonGui === true` AND `trangThai !== "Đã gửi"` AND `emailNhan !== ""`.
  * Gửi qua `GmailApp.sendEmail` với tên người gửi hiển thị: `Đội ngũ Tetrasco`.
  * Cập nhật trực tiếp trạng thái `"Đã gửi"` (màu xanh lá) vào ô tính.
  * Hiển thị popup tổng kết số email đã gửi.

---

### 2. Phân hệ Tạo Hóa Đơn Tự Động (`createMissingInvoices`)
* **Cấu trúc dữ liệu Sheet**:
  * **Sheet `Xuất hóa đơn`**: Bảng Master chứa thông tin chung (Mã HĐ, Ngày tạo, Tên khách hàng, Tên công ty, Địa chỉ, Mã số thuế, Có VAT hay không `hasVat`, Tổng tiền, Link PDF đã xuất, Mã ngẫu nhiên / Payment Code).
  * **Sheet `Data hóa đơn`**: Bảng Detail chứa các dòng hàng hóa/dịch vụ (Mã HĐ liên kết, Tên dịch vụ, Mô tả, MetaInfo / Thời gian dịch vụ `Từ ngày - Đến ngày`, Đơn giá).
* **Quy trình tính toán & sinh mã**:
  1. **Lọc dòng hàng hóa**: Ghép dữ liệu từ `Data hóa đơn` theo `id` (Mã HĐ).
  2. **Xử lý thời hạn dịch vụ**: Ghép chuỗi khoảng thời gian `(dd/MM/yyyy - dd/MM/yyyy)` vào mô tả chi tiết dịch vụ.
  3. **Tính toán tài chính**:
     * $Tạm tính (SubTotal) = \sum Đơn giá$
     * $VAT = SubTotal \times 10\%$ (nếu `hasVat == true`)
     * $Tổng cộng = SubTotal + VAT$
  4. **Tạo mã thanh toán & VietQR động (SePay)**:
     * Sinh mã code ngẫu nhiên gồm 6 ký tự (VD: `A8X9K2`).
     * Tạo cú pháp nội dung chuyển khoản: `[Mã ngẫu nhiên] - [Tên dịch vụ]` (VD: `A8X9K2 - Dịch vụ Marketing`).
     * Gọi API tạo mã VietQR SePay:
       ```
       https://qr.sepay.vn/img?bank=Vietcombank&acc=SHYNNERI&template=compact&amount={grandTotal}&des={paymentDescription}
       ```
     * Tải hình ảnh QR về và chuyển đổi sang chuỗi `Base64` (`data:image/png;base64,...`) để nhúng trực tiếp vào template PDF, tránh lỗi cross-origin hoặc phụ thuộc mạng khi render.

---

### 3. Phân hệ Render & Xuất PDF (`generatePDF`)
* Sử dụng HTML Template (`InvoiceTemplate.html`).
* Truyền dữ liệu: `header`, `buyer`, `items`, `totals`, `qrBase64`.
* Lưu trữ vào Google Drive (`FOLDER_ID`), nếu đã có file cũ trùng tên thì xóa (move to trash) hoặc đổi tên lưu bản ghi.
* Trả về URL xem file PDF trên Google Drive và lưu lại vào Sheet.

---

## II. Các Điểm Sáng Giá & "Key Feature" Cần Kế Thừa Vào Hệ Thống Mới

1. **Tích hợp VietQR Thanh Toán Động (SePay / VietQR chuẩn Napas)**:
   * **Cực kỳ tiện lợi cho khách hàng**: Khách hàng quét mã QR trên hóa đơn là ngân hàng tự điền đúng Số tài khoản, Số tiền chính xác và Nội dung thanh toán kèm Mã hóa đơn/Mã tham chiếu.
   * Đây là tính năng khác biệt lớn so với các phần mềm hóa đơn truyền thống.
2. **Hỗ trợ MetaInfo khoảng thời gian dịch vụ**:
   * Rất phù hợp với các dịch vụ gói (Subscription, dịch vụ hàng tháng, bảo trì phần mềm...).
3. **Cơ chế nhúng mã QR trực tiếp (Base64 / Local Asset)**:
   * Khi render PDF bằng Playwright trên backend, việc nhúng QR trực tiếp giúp PDF được tạo ngay lập tức mà không bị timeout do mạng ngoài.

---

## III. Đề Xuất Chuyển Đổi & Nâng Cấp Vào Hệ Thống Mới (Invoice-AIR)

| Thành phần trong Apps Script | Chuyển đổi sang Hệ thống Mới (NestJS + Next.js) | Lợi ích nâng cấp |
| :--- | :--- | :--- |
| **Giao diện Sheet** | **Giao diện Web UI (Next.js + Tailwind + shadcn/ui)** | Trực quan, dễ dùng, có preview realtime thay vì nhìn bảng tính thô |
| **Data liên kết 2 Sheet** | **SQLite / libSQL + Prisma ORM** (Model `Invoice` & `InvoiceItem`) | Dữ liệu quan hệ chặt chẽ, không bị lỗi duplicate hay mất data |
| **Tạo QR tĩnh SePay** | **Module Payment QR Generator** (Tùy biến cấu hình Ngân hàng & STK trong mục Settings) | Cho phép người dùng tự đổi tài khoản ngân hàng bất kỳ (Vietcombank, MB, Techcombank,...) |
| **Mã code ngẫu nhiên (6 ký tự)** | **Payment Reference Code** (Tự sinh hoặc dùng trực tiếp theo Mã HĐ) | Dễ dàng đối soát thanh toán tự động trong tương lai |
| **Render PDF Google HtmlService** | **Playwright Headless Renderer** | Chuẩn A4/A5, CSS hiện đại, xuất file siêu nét, không phụ thuộc Google Drive |
| **Lưu Drive** | **Cloudflare R2 Storage** | Tốc độ tải nhanh, chi phí 0đ (10GB free), link public trực tiếp cho khách |
| **Gửi Gmail tay từng dòng** | **Module Email Service (SMTP/Resend)** | Gửi hàng loạt hoặc gửi từng hóa đơn kèm đính kèm PDF và link xem hóa đơn |

---

## V. So Sánh & Phân Tích Phiên Bản Mã Nguồn 2 (Phiên bản Tiền nhiệm / Baseline)

Phiên bản bạn vừa gửi là **phiên bản trước (Baseline)** so với phiên bản có mã SePay động. Dưới đây là các điểm khác biệt và bài học rút ra:

### 1. Cơ chế Reset Checkbox trong Gửi Email
* Trong phiên bản này, sau khi gửi email thành công:
  ```javascript
  sheet.getRange(actualRow, 8).setValue("Đã gửi").setFontColor("#009900");
  sheet.getRange(actualRow, 9).setValue(false); // Bỏ tích chọn checkbox
  ```
  👉 **Ứng dụng vào hệ thống mới**: Trên giao diện Web table (Next.js + TanStack Table / shadcn), khi chọn nhiều hóa đơn bằng checkbox (Bulk Select) để bấm **"Gửi Email Hàng Loạt"**, sau khi gửi thành công thì hệ thống sẽ:
  - Tự động uncheck danh sách đã chọn.
  - Cập nhật trạng thái `status: SENT`.
  - Hiển thị Toast notification số lượng email đã gửi thành công.

### 2. Sự khác biệt về QR Code: QR Tĩnh (`MY_QR_IMAGE2`) vs QR Động (VietQR)
* **Phiên bản này**: Dùng biến cố định `MY_QR_IMAGE2` (ảnh QR tĩnh). Khách hàng quét mã này phải tự nhập số tiền và tự nhập nội dung chuyển khoản thủ công (dễ bị sai sót, thiếu nội dung).
* **Phiên bản có SePay**: Sinh QR động tự động điền sẵn chính xác số tiền và mã hóa đơn.
* 👉 **Giải pháp cho hệ thống mới**:
  - Hỗ trợ **cả 2 chế độ** trong phần Cài đặt (Settings):
    1. **Chế độ QR Động (Khuyên dùng)**: Tự sinh VietQR Napas chuẩn theo từng hóa đơn + số tiền + mã đối soát.
    2. **Chế độ Ảnh QR Tĩnh**: Cho phép người dùng upload ảnh QR tài khoản/MoMo tĩnh của họ nếu không muốn sinh động.


Trong Prisma schema (`backend/prisma/schema.prisma`), chúng ta sẽ hỗ trợ:

```prisma
model Invoice {
  id              String         @id @default(uuid())
  invoiceNumber   String         @unique
  paymentCode     String?        // Mã code đối soát thanh toán (VD: A8X9K2)
  status          InvoiceStatus  @default(DRAFT)
  issueDate       DateTime
  dueDate         DateTime?
  currency        String         @default("VND")
  hasVat          Boolean        @default(false)
  vatRate         Float?         @default(10)
  subTotal        Float
  vatAmount       Float          @default(0)
  grandTotal      Float
  
  // Thông tin ngân hàng & QR hiển thị trên hóa đơn
  bankCode        String?        // VD: Vietcombank, MB, ACB...
  bankAccount     String?        // Số tài khoản
  bankAccountName String?        // Tên chủ tài khoản
  qrDataUrl       String?        // Base64 QR hoặc link VietQR
  
  pdfUrl          String?        // Link PDF trên Cloudflare R2
  shareToken      String?        @unique // Link xem hóa đơn không cần login
  
  items           InvoiceItem[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
```
