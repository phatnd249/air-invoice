# Phân Tích & Đặc Tả Template Hóa Đơn (HTML/CSS)

Tài liệu này lưu trữ và phân tích mẫu HTML Template thực tế mà bạn đang sử dụng, đồng thời định hình cách đưa template này trở thành **Default Template (Chuẩn A4)** trong hệ thống mới **Invoice-AIR**.

---

## 1. Phân Tích Bố Cục Template Hiện Tại

### 🌟 Header & Định danh
* **Tiêu đề**: `HÓA ĐƠN {id}`
* **Trạng thái**: Hiển thị dưới dạng Badge (`Chưa thanh toán` / `Đã thanh toán` / `DRAFT` / `ISSUED`).
* **Ngày lập**: Hiển thị góc trên bên phải (`header.createdDate`).
* **Tone màu chủ đạo**: `#2c3e50` (Midnight Blue - thanh lịch, nghiêm túc) và `#e74c3c` (Đỏ cho badge trạng thái).

### 🏢 Thông tin 2 bên (Info Grid)
* **Bên trái (Nhà cung cấp / Seller)**:
  * Tên công ty: `CÔNG TY TNHH GIÁO DỤC AI ROBOTIC`
  * Địa chỉ: `Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai`
  * Mã số thuế: `MST: 3603893101`
  *(Trong hệ thống mới sẽ được cấu hình động trong mục **Settings / Cài đặt**)*.
* **Bên phải (Khách hàng / Buyer)**:
  * Tên người mua (`buyer.name`)
  * Tên công ty (`buyer.companyName`)
  * Địa chỉ (`buyer.address1`)
  * Mã số thuế (`buyer.taxId`)

### 📋 Bảng Hàng Hóa & Dịch Vụ (Items Table)
* Cấu trúc 3 cột: `# (STT)` (5%), `Dịch Vụ` (65%), `Thành Tiền` (30%).
* Dòng dịch vụ hiển thị phân tầng 3 cấp rất rõ ràng:
  1. **Tên dịch vụ** (`.item-name`): In đậm, màu `#2c3e50`.
  2. **Mô tả chi tiết** (`.item-desc`): Chữ thường, màu `#333`.
  3. **Thời hạn dịch vụ** (`.item-meta`): Chữ nghiêng mờ `(dd/MM/yyyy - dd/MM/yyyy)`, màu `#7f8c8d`.

### 💳 Footer & Khối Thanh Toán (QR Code + Tổng Tiền)
* **Bên trái**: Khu vực Quét mã thanh toán (`.qr-area`), nhúng trực tiếp chuỗi `qrBase64` kích thước `240px`.
* **Bên phải**: Khối tổng tiền (`.total-box`):
  * Tổng phụ (Subtotal)
  * VAT 10%
  * TỔNG CỘNG (`.grand-total` có viền kẻ nổi bật)
* **CSS Print Rule**: Sử dụng `page-break-inside: avoid;` để phần footer không bị rớt trang một cách đứt gãy khi in.

---

## 2. Mã Nguồn Gốc Template (Lưu Trữ Làm Mẫu Mặc Định)

```html
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      color: #333;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding-bottom: 50px; 
    }

    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #2c3e50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 26px;
    }

    .badge {
      background: #e74c3c;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 10px;
      vertical-align: middle;
    }

    .info-grid {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
    }

    .col {
      flex: 1;
    }

    .label {
      font-weight: bold;
      text-transform: uppercase;
      color: #7f8c8d;
      font-size: 11px;
      margin-bottom: 5px;
      display: block;
    }

    .value {
      margin-bottom: 3px;
      line-height: 1.4;
    }

    .highlight {
      font-weight: bold;
      color: #000;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    th {
      text-align: left;
      padding: 10px;
      background: #ecf0f1;
      border-bottom: 2px solid #bdc3c7;
      font-size: 12px;
      text-transform: uppercase;
    }

    td {
      padding: 12px 10px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }

    .text-right {
      text-align: right;
    }

    .item-name {
      font-weight: bold;
      color: #2c3e50;
      display: block;
      margin-bottom: 4px;
    }

    .item-desc {
      display: block;
      color: #333;
      margin-bottom: 4px;
    }

    .item-meta {
      display: block;
      font-size: 12px;
      color: #7f8c8d;
      font-style: italic;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 20px;
      page-break-inside: avoid;
    }

    .total-box {
      width: 250px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
    }

    .grand-total {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #2c3e50;
      margin-top: 10px;
      padding-top: 10px;
      color: #2c3e50;
    }

    .qr-area {
      text-align: center;
      padding: 10px;
    }

    .qr-img {
      width: 240px; 
      height: auto;
      display: block;
      margin: 0 auto;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>HÓA ĐƠN {{invoice.invoiceNumber}} <span class="badge">{{invoice.statusText}}</span></h1>
      </div>
      <div>Ngày lập: <strong>{{invoice.issueDate}}</strong></div>
    </div>

    <div class="info-grid">
      <div class="col">
        <span class="label">Nhà cung cấp</span>
        <div class="value highlight">{{seller.name}}</div>
        <div class="value">{{seller.address}}</div>
        <div class="value">MST: {{seller.taxCode}}</div>
      </div>
      <div class="col">
        <span class="label">Khách hàng</span>
        <div class="value highlight">{{buyer.name}}</div>
        <div class="value">{{buyer.companyName}}</div>
        <div class="value">{{buyer.address}}</div>
        <div class="value">MST: {{buyer.taxCode}}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 5%">#</th>
          <th style="width: 65%">Dịch Vụ</th>
          <th class="text-right" style="width: 30%">Thành Tiền</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loop items -->
        <tr>
          <td>1</td>
          <td>
            <span class="item-name">Tên Dịch Vụ Mẫu</span>
            <span class="item-desc">Mô tả chi tiết dịch vụ</span>
            <span class="item-meta">(01/01/2026 - 31/01/2026)</span>
          </td>
          <td class="text-right">10.000.000 ₫</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div class="qr-area">
        <div style="font-size: 11px; margin-bottom: 8px; color:#888;">Quét mã thanh toán</div>
        <img src="{{qrDataUrl}}" class="qr-img" alt="VietQR Payment" />
      </div>

      <div class="total-box">
        <div class="row"><span>Tổng phụ:</span> <span>{{totals.subTotal}}</span></div>
        <div class="row"><span>VAT ({{vatRate}}%):</span> <span>{{totals.vatAmount}}</span></div>
        <div class="row grand-total"><span>TỔNG CỘNG:</span> <span>{{totals.grandTotal}}</span></div>
      </div>
    </div>
  </div>
</body>

</html>
```

---

## 3. Kế Hoạch Ứng Dụng Trong Hệ Thống Mới

1. **Làm Mẫu Gốc `classic-blue` (Default Template)**:
   - Template này có bố cục rất cân đối và phù hợp cho các doanh nghiệp cung cấp dịch vụ / giáo dục / công nghệ.
   - Sẽ được đóng gói thành template mặc định có sẵn trong hệ thống (Next.js Preview & Playwright PDF Generator).
2. **Dynamic Data Binding (Thay thế biến cứng)**:
   - Thông tin bên bán (`CÔNG TY TNHH GIÁO DỤC AI ROBOTIC`, địa chỉ, MST, logo) sẽ tự động lấy từ bảng cấu hình `Settings` của người dùng.
   - Mã QR sẽ được sinh động theo tài khoản ngân hàng cấu hình và số tiền thực tế của hóa đơn.
