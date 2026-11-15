# 🎓 HỆ THỐNG QUẢN LÝ ĐÀO TẠO SAU ĐẠI HỌC - BẬC THẠC SĨ (AGU POSTGRAD)

> **AGU Postgraduate Management System**  
> **Học phần:** Công nghệ mới trong phát triển phần mềm  
> **Đơn vị:** Khoa Công nghệ Thông tin – Trường Đại học An Giang (ĐHQG-HCM)

---

Hệ thống quản lý tuyển sinh và quá trình đào tạo sau đại học tại Trường Đại học An Giang. Dự án gồm frontend React, backend REST API và cơ sở dữ liệu Microsoft SQL Server.

## ✨ Chức năng chính

- **Tuyển sinh:** Quản lý đợt tuyển sinh, ngành đào tạo, nộp hồ sơ và tra cứu kết quả.
- **Quản trị:** Xét duyệt hồ sơ, công nhận trúng tuyển, quản lý học viên và giảng viên, thành lập hội đồng, xem thống kê.
- **Học viên:** Xem hồ sơ, học phí, lịch học, điểm số và tiến độ luận văn.
- **Giảng viên:** Quản lý học viên hướng dẫn, hạn mức hướng dẫn và các nghiệp vụ đào tạo.
- **Luận văn và khảo sát:** Theo dõi tiến độ, lịch bảo vệ, đánh giá và phản hồi khảo sát.

> **Quy tắc cấp tài khoản học viên:** `username` được tạo theo dạng `hv_` + hai phần tên cuối, viết thường, bỏ dấu và nối liền (Ví dụ: `Vân D` → `hv_vand`). Nếu `username` đã tồn tại, hệ thống tự động thêm hậu tố để đảm bảo duy nhất.

---

## 🏗️ Kiến trúc & Công nghệ sử dụng

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, ExcelJS (`frontend/`)
- **Backend:** Node.js, Express.js, RESTful API, JWT, Socket.IO, Node-Cron, Multer (`backend/`)
- **Database:** Microsoft SQL Server (T-SQL, Triggers, Stored Procedures) kết nối qua `mssql` / `msnodesqlv8`

---

## 📁 Cấu trúc repository

```text
.
├── backend/                 # API, xác thực, nghiệp vụ và tác vụ định kỳ
├── database/                # Schema, dữ liệu mẫu và migration
├── frontend/                # Ứng dụng React
├── SQLQuery2.sql            # Script SQL khởi tạo thay thế
└── package.json             # Các lệnh chạy dự án từ thư mục gốc