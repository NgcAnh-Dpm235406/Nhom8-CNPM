# AGU Postgraduate Management System

Hệ thống quản lý tuyển sinh và quá trình đào tạo sau đại học tại Trường Đại học An Giang. Dự án gồm frontend React, backend REST API và cơ sở dữ liệu Microsoft SQL Server.

## Chức năng chính

- **Tuyển sinh:** quản lý đợt tuyển sinh, ngành đào tạo, nộp hồ sơ và tra cứu kết quả.
- **Quản trị:** xét duyệt hồ sơ, công nhận trúng tuyển, quản lý học viên và giảng viên, thành lập hội đồng, xem thống kê.
- **Học viên:** xem hồ sơ, học phí, lịch học, điểm số và tiến độ luận văn.
- **Giảng viên:** quản lý học viên hướng dẫn, hạn mức hướng dẫn và các nghiệp vụ đào tạo.
- **Luận văn và khảo sát:** theo dõi tiến độ, lịch bảo vệ, đánh giá và phản hồi khảo sát.

Khi cấp tài khoản học viên, username được tạo theo dạng `hv_` + hai phần tên cuối, viết thường, bỏ dấu và nối liền. Ví dụ: `Vân D` → `hv_vand`. Nếu username đã tồn tại, hệ thống thêm hậu tố để đảm bảo duy nhất.

## Công nghệ

- Frontend: React, TypeScript, Vite, Tailwind CSS.
- Backend: Node.js, Express, JWT, Socket.IO.
- Cơ sở dữ liệu: Microsoft SQL Server qua `mssql` / `msnodesqlv8`.

## Cấu trúc repository

```text
.
├── backend/                 # API, xác thực, nghiệp vụ và tác vụ định kỳ
├── database/                # Schema, dữ liệu mẫu và migration
├── frontend/                # Ứng dụng React
├── SQLQuery2.sql            # Script SQL khởi tạo thay thế
└── package.json             # Các lệnh chạy dự án từ thư mục gốc
```

## Yêu cầu

- Node.js 20.19 trở lên hoặc 22.12 trở lên và npm.
- Microsoft SQL Server.
- Microsoft ODBC Driver 18 for SQL Server (khuyến nghị) và quyền Windows Authentication tới database.

## Cài đặt và chạy local

### 1. Khởi tạo database

Trong SQL Server Management Studio, chạy **một trong hai** script khởi tạo:

- [`database/schema_and_seed.sql`](database/schema_and_seed.sql)
- [`SQLQuery2.sql`](SQLQuery2.sql)

> **Cảnh báo:** các script khởi tạo có thể xóa và tạo lại database `agu_postgrad_db`. Không chạy trên database đang có dữ liệu cần giữ. Khi nâng cấp database hiện có, chỉ chạy migration phù hợp, ví dụ [`database/migrations/add_admission_profile_major_id.sql`](database/migrations/add_admission_profile_major_id.sql).

### 2. Cấu hình backend

Tạo file `backend/.env` và thiết lập các giá trị phù hợp với máy của bạn:

```env
PORT=5000
DB_DRIVER=ODBC Driver 18 for SQL Server
DB_SERVER=localhost
DB_NAME=agu_postgrad_db
FALLBACK_DRIVER=SQL Server
JWT_SECRET=replace-with-a-long-random-secret
```

Không commit file `.env` hoặc chia sẻ `JWT_SECRET`. Backend dùng Windows Trusted Connection để kết nối SQL Server.

### 3. Cài dependencies

Từ thư mục gốc repository:

```powershell
npm install --prefix backend
npm install --prefix frontend
```

### 4. Chạy frontend và backend

Mở **hai terminal** tại thư mục gốc repository:

Terminal 1:

```powershell
npm run dev:backend
```

Terminal 2:

```powershell
npm run dev:frontend
```

Mở địa chỉ Vite được in ra trong terminal. Frontend proxy các yêu cầu `/api` tới backend tại `http://localhost:5000`. Backend health check: `http://localhost:5000/api/health`.

Chỉ chạy **một** backend trên mỗi cổng. Nếu thấy lỗi `EADDRINUSE`, cổng đã được một tiến trình khác sử dụng; dừng tiến trình đó hoặc cấu hình `PORT` khác và cập nhật proxy frontend tương ứng.

## Build và chạy backend phục vụ frontend

```powershell
npm run build:frontend
npm start
```

Backend mặc định chạy ở cổng 5000 và phục vụ giao diện đã build trong `frontend/dist`.

## Lệnh thường dùng

| Lệnh | Mô tả |
|---|---|
| `npm run dev:backend` | Chạy backend ở chế độ theo dõi thay đổi |
| `npm run dev:frontend` | Chạy Vite development server |
| `npm run build:frontend` | Type-check và build frontend |
| `npm start` | Chạy backend |
| `npm --prefix frontend run lint` | Kiểm tra lint frontend |

## Thành viên

| STT | Họ và tên | MSSV | Vai trò |
|:---:|---|---|---|
| 1 | Nguyễn Huỳnh Ngọc Anh | DPM235406 | Product Owner / Team Lead |
| 2 | Nguyễn Thị Ngân Huệ | DPM235422 | Frontend Developer |
| 3 | Huỳnh Hiếu | DPM235419 | Frontend Developer |
| 4 | Mạc Dương Hoàng Phúc | DPM235466 | Backend Developer |
| 5 | Lê Trương Bảo Trân | DPM235487 | Backend Developer |
| 6 | Ngô Đình Khang | DPM235428 | QA / Security & Data Specialist |
| 7 | Lâm Thái Khang | DPM235426 | DevOps / Cloud Engineer |
