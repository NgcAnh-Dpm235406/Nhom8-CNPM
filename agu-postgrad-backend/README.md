# 🎓 AGU PostGrad — Backend API

### Phân hệ máy chủ cho Hệ thống Quản lý Quá trình Đào tạo Thạc sĩ

> **Học phần:** Công nghệ mới trong phát triển phần mềm  
> **Khoa:** Công nghệ Thông tin — Trường Đại học An Giang (ĐHQG-HCM)  
> **Năm học:** 2026–2027

---

## 1. Giới thiệu

Backend cung cấp REST API và các dịch vụ thời gian thực cho hệ thống quản lý đào tạo sau đại học. Hệ thống hỗ trợ các vai trò **thí sinh, học viên, giảng viên và quản trị viên**.

Các chức năng chính:

- Tiếp nhận hồ sơ tuyển sinh, tra cứu kết quả, xét duyệt và công nhận trúng tuyển.
- Tạo tài khoản học viên và mã học viên sau khi công nhận trúng tuyển.
- Quản lý thông tin học viên, giảng viên, chương trình đào tạo, lớp học và điểm số.
- Gửi và duyệt yêu cầu giảng viên hướng dẫn; theo dõi hạn mức hướng dẫn.
- Quản lý đề tài, tiến độ luận văn, tài liệu minh chứng và kết quả bảo vệ.
- Quản lý khảo sát, thông báo, nhật ký hoạt động và cập nhật slot qua Socket.IO.

## 2. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js |
| Web/API | Express 5 |
| Cơ sở dữ liệu | Microsoft SQL Server |
| Kết nối SQL Server | `mssql` và `msnodesqlv8` |
| Xác thực | JSON Web Token (JWT) |
| Mã hóa mật khẩu | `bcryptjs` |
| Tải tệp | `multer` |
| Giao tiếp thời gian thực | Socket.IO |
| Công việc định kỳ | `node-cron` |

## 3. Cấu trúc thư mục

```text
agu-postgrad-backend/
├── config/             # Cấu hình kết nối SQL Server
├── controllers/        # Xử lý nghiệp vụ và API
├── jobs/               # Tác vụ định kỳ, nhắc hạn
├── middlewares/        # Xác thực, phân quyền và tải tệp
├── routes/             # Khai báo các endpoint
├── sockets/            # Sự kiện Socket.IO
├── uploads/            # Tệp người dùng tải lên
├── server.js           # Điểm khởi chạy ứng dụng
├── package.json
└── README.md
```

## 4. Yêu cầu

- Node.js 18 trở lên và npm.
- Microsoft SQL Server đang chạy.
- Microsoft ODBC Driver 18 for SQL Server (khuyến nghị) hoặc SQL Server ODBC driver phù hợp trên máy.
- Frontend đã build nếu muốn backend phục vụ cả website tại cùng một địa chỉ.

## 5. Cài đặt cơ sở dữ liệu

Tệp SQL khởi tạo cấu trúc và dữ liệu mẫu nằm ở thư mục gốc repository: [`SQLQuery2.sql`](../SQLQuery2.sql).

1. Mở SQL Server Management Studio (SSMS) và kết nối tới SQL Server.
2. Mở và chạy `SQLQuery2.sql` khi đang kết nối tới SQL Server. Script tự tạo database `agu_postgrad_db` và các bảng/dữ liệu mẫu.
3. Đảm bảo SQL Server cho phép kết nối Windows Authentication từ tài khoản Windows đang chạy backend.

> **Cảnh báo mất dữ liệu:** `SQLQuery2.sql` chủ động xóa database `agu_postgrad_db` hiện có rồi tạo lại. Chạy script sẽ xóa toàn bộ dữ liệu trong database đó. Chỉ chạy trên môi trường mới hoặc sau khi đã sao lưu và xác nhận có thể xóa dữ liệu. Nếu dùng tên database khác, cần cập nhật script và `DB_NAME` cho khớp.

## 6. Cấu hình môi trường

Tạo file `.env` trong thư mục `agu-postgrad-backend/`:

```env
PORT=5000
DB_DRIVER=ODBC Driver 18 for SQL Server
DB_SERVER=localhost
DB_NAME=agu_postgrad_db
FALLBACK_DRIVER=SQL Server
JWT_SECRET=replace-with-a-long-random-secret
```

- `DB_SERVER`: tên server hoặc instance SQL Server, ví dụ `localhost`, `localhost\\SQLEXPRESS`.
- `DB_NAME`: tên database đã khởi tạo.
- `DB_DRIVER`: driver chính; nếu kết nối thất bại, ứng dụng thử `FALLBACK_DRIVER`.
- `PORT`: cổng HTTP; mặc định `5000`.
- `JWT_SECRET`: đặt một chuỗi ngẫu nhiên, dài và riêng cho môi trường của bạn. Không commit file `.env` hoặc chia sẻ khóa này.

Ứng dụng sử dụng Windows Trusted Connection để kết nối SQL Server. Hãy cài driver ODBC tương ứng và cấp quyền database cho tài khoản Windows chạy ứng dụng.

## 7. Chạy ứng dụng

Mở terminal tại thư mục backend:

```powershell
cd agu-postgrad-backend
npm install
npm start
```

Khi server khởi động, API mặc định ở `http://localhost:5000`. Kiểm tra trạng thái server tại:

```text
http://localhost:5000/api/health
```

Endpoint trả về trạng thái dịch vụ dạng JSON.

### Chạy website và API cùng một địa chỉ

Backend được cấu hình phục vụ frontend đã build từ `agu-postgrad-frontend/dist`.

```powershell
cd agu-postgrad-frontend
npm install
npm run build

cd ..\agu-postgrad-backend
npm install
npm start
```

Sau đó mở `http://localhost:5000`. Khi cập nhật giao diện, build lại frontend để backend phục vụ phiên bản mới.

## 8. Các nhóm API

API sử dụng tiền tố `/api`. Các endpoint cần đăng nhập yêu cầu token JWT trong header:

```http
Authorization: Bearer <token>
```

| Nhóm | Tiền tố | Chức năng |
|---|---|---|
| Xác thực | `/api/auth` | Đăng nhập, hồ sơ, đổi mật khẩu, thông báo |
| Tuyển sinh | `/api/admission` | Đợt tuyển sinh, nộp hồ sơ, tra cứu, xét duyệt, nhập học |
| Đào tạo | `/api/academic` | Ngành, chương trình, học phần, giảng viên, học kỳ và lớp |
| Học viên | `/api/students` | Hồ sơ cá nhân, học phí, đăng ký học phần, thời khóa biểu và điểm |
| Luận văn | `/api/thesis` | Đề tài, yêu cầu GVHD, tiến độ và tài liệu luận văn |
| Hội đồng | `/api/committee` | Điều kiện bảo vệ, lịch bảo vệ và đánh giá |
| Khảo sát | `/api/surveys` | Câu hỏi, chiến dịch khảo sát, gửi phản hồi và thống kê |
| Quản trị | `/api/admin` | Quản lý giảng viên, hội đồng và đánh giá bảo vệ |
| Kiểm tra dịch vụ | `/api/health` | Health check |

Các route có xác thực được phân quyền theo vai trò ở middleware. Xem chi tiết method và tham số trong các tệp `routes/`.

## 9. Tải tệp

- Tệp tải lên được lưu trong `agu-postgrad-backend/uploads/`.
- Tệp có thể được truy cập qua đường dẫn `/uploads/<tên-tệp>`.
- Middleware giới hạn kích thước tệp tối đa **25 MB** và lọc định dạng tài liệu được hỗ trợ.
- Không xóa thư mục `uploads/` nếu cần giữ lại minh chứng đã tải lên.

## 10. Cấu hình khi triển khai

- Đặt `JWT_SECRET` riêng, đủ mạnh; không dùng khóa mặc định trong môi trường thật.
- Chỉ cho phép nguồn CORS đáng tin cậy thay vì cấu hình mở.
- Dùng HTTPS và bảo vệ tệp `.env`, dữ liệu database cùng thư mục tải lên.
- Sao lưu SQL Server và các tệp trong `uploads/` định kỳ.
- Đảm bảo SQL Server và Node.js có thể truy cập từ máy chủ triển khai.

## 11. Xử lý lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
|---|---|
| Không kết nối được SQL Server | Kiểm tra SQL Server service, `DB_SERVER`, `DB_NAME`, ODBC driver và quyền Windows Authentication. |
| `Invalid object name` hoặc thiếu bảng | Chạy script `SQLQuery2.sql` trên đúng database. |
| Website không hiện sau khi mở backend | Build frontend trước và kiểm tra thư mục `agu-postgrad-frontend/dist`. |
| API trả về `401` hoặc `403` | Đăng nhập lại để lấy JWT hợp lệ và kiểm tra vai trò của tài khoản. |
| Tải tệp thất bại | Kiểm tra định dạng, kích thước tối đa 25 MB và quyền ghi vào thư mục `uploads/`. |

---

**Frontend:** [`agu-postgrad-frontend`](../agu-postgrad-frontend/)  
**SQL khởi tạo:** [`SQLQuery2.sql`](../SQLQuery2.sql)
