# 🎓 HỆ THỐNG QUẢN LÝ ĐÀO TẠO SAU ĐẠI HỌC - BẬC THẠC SĨ (AGU POSTGRAD)

> **Học phần:**  Công nghệ mới trong phát triển phần mềm  
> **Đơn vị:** Khoa Công nghệ Thông tin – Trường Đại học An Giang (ĐHQG-HCM)

---

## 👥 Danh sách thành viên và Phân công vai trò

| STT | Họ và tên | MSSV | Vai trò chính |
|:---:|---|---|---|
| 1 | Nguyễn Huỳnh Ngọc Anh | DPM235406 | **Product Owner (PO) / Team Lead** |
| 2 | Nguyễn Thị Ngân Huệ | DPM235422 | **Frontend Developer** |
| 3 | Huỳnh Hiếu | DPM235419 | **Frontend Developer** |
| 4 | Mạc Dương Hoàng Phúc | DPM235466 | **Backend Developer** |
| 5 | Lê Trương Bảo Trân | DPM235487 | **Backend Developer** |
| 6 | Ngô Đình Khang | DPM235428 | **QA / Security & Data Specialist** |
| 7 | Lâm Thái Khang | DPM235426 | **DevOps / Cloud Engineer** |

---

## 🏗️ Kiến trúc & Công nghệ sử dụng

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, ExcelJS (`frontend/`)
- **Backend:** Node.js, Express.js, RESTful API, Socket.IO, Node-Cron, Multer (`backend/`)
- **Database:** Microsoft SQL Server (T-SQL, Triggers, Stored Procedures) (`SQLQuery2.sql`)

---

## ⚙️ Hướng dẫn cài đặt và khởi chạy

### 1. Khởi tạo Cơ sở dữ liệu (SQL Server)
1. Mở **SQL Server Management Studio (SSMS)**.
2. Mở file `SQLQuery2.sql` ở thư mục gốc và nhấn **Execute (F5)** để tự động tạo CSDL `agu_postgrad_db` cùng toàn bộ bảng, Trigger, Stored Procedures và dữ liệu mẫu.

### 2. Cấu hình biến môi trường Backend
1. Trong thư mục `backend/`, tạo bản sao từ file `.env.example` và đổi tên thành `.env`.
2. Cập nhật giá trị `DB_SERVER` đúng với tên SQL Server Instance trên máy (ví dụ: `localhost` hoặc `TEN_MAY\SQLEXPRESS`).

### 3. Cài đặt thư viện và chạy dự án
```bash
# Cài đặt thư viện
cd backend && npm install
cd ../frontend && npm install
cd ..

# Chạy máy chủ Backend (Port 5000)
npm run dev:backend

# Mở thêm 1 Terminal mới để chạy Frontend (Port 5173)
npm run dev:frontend