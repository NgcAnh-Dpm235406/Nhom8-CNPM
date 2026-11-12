# 🎓 HỆ THỐNG QUẢN LÝ QUÁ TRÌNH ĐÀO TẠO THẠC SĨ (POSTGRADUATE MANAGEMENT SYSTEM)
### Phân Hệ Giao Diện Người Dùng (Frontend Application)

> **Học phần:** Công nghệ mới trong phát triển phần mềm  
> **Khoa:** Công nghệ Thông tin – Trường Đại học An Giang (ĐHQG-HCM)  
> **Năm học:** 2026 - 2027  

---

## 1. 🌐 Bối Cảnh Đề Tài & Ngữ Cảnh Nghiệp Vụ (Project Context)

### 1.1. Thực trạng & Đặt vấn đề
Hiện nay, công tác quản lý đào tạo trình độ Thạc sĩ tại các trường đại học nói chung và Trường Đại học An Giang nói riêng đối mặt với nhiều thách thức:
- **Tuyển sinh thủ công:** Tiếp nhận hồ sơ giấy hoặc qua email rời rạc, khó kiểm soát định dạng và dung lượng minh chứng (bằng cấp, bảng điểm, chứng chỉ ngoại ngữ).
- **Thiếu giám sát tiến độ trực quan:** Quy trình thực hiện luận văn thạc sĩ trải qua nhiều mốc nghiêm ngặt (đề cương, Turnitin, phản biện, bảo vệ). Việc theo dõi thủ công dễ dẫn đến tình trạng trễ hạn hoàn thành luận văn hoặc nợ chuẩn đầu ra ngoại ngữ (VSTEP B2).
- **Quản lý hạn mức giảng viên (Quota/Slot):** Thông tư của Bộ GD&ĐT và Quy chế đào tạo Sau đại học quy định mỗi giảng viên (Tiến sĩ, PGS, GS) chỉ được hướng dẫn đồng thời một số lượng học viên nhất định. Trước đây việc phân công còn phân tán, dễ dẫn đến vượt định mức cho phép.

### 1.2. Mục tiêu giải pháp
Đồ án xây dựng **Hệ thống Quản lý Quá trình Đào tạo Thạc sĩ** theo mô hình hiện đại nhằm:
- Số hóa 100% quy trình tiếp nhận hồ sơ xét tuyển dự tuyển trực tuyến (giới hạn dung lượng tải lên $\le$ 25MB).
- Công khai, minh bạch việc tra cứu kết quả trúng tuyển theo CCCD/Mã hồ sơ.
- Cung cấp Dashboard học viên với cơ chế **cảnh báo tiến độ theo 3 mức màu trực quan (Xanh - Vàng - Đỏ)**.
- Tự động hóa và theo dõi hạn mức (slot) hướng dẫn của giảng viên theo thời gian thực (Real-time).

---

## 2. 🏛️ Ngữ Cảnh Kiến Trúc Hệ Thống (System & Technical Context)

Kho lưu trữ (repository) này là **Phân hệ Giao diện Người dùng (Frontend Client)** độc lập, tuân thủ nguyên tắc tách biệt Frontend - Backend (Decoupled Architecture):

```text
                  +--------------------------------------------------+
                  |               NGƯỜI DÙNG HỆ THỐNG                |
                  |  (Thí sinh • Học viên • Giảng viên • Quản trị)   |
                  +--------------------------------------------------+
                                           |
                                      (HTTPS / Web)
                                           v
                  +--------------------------------------------------+
                  |         PHÂN HỆ FRONTEND (Repo Hiện Tại)         |
                  |   React 18 • Vite • TypeScript • Tailwind CSS    |
                  +--------------------------------------------------+
                                           |
                               (RESTful API / JSON Calls)
                                           v
                  +--------------------------------------------------+
                  |               BACKEND SERVICES (API)             |
                  |     - Dịch vụ Đào tạo & Tuyển sinh (PHP / Node)  |
                  |     - Dịch vụ Lưu trữ tệp minh chứng (<= 25MB)   |
                  |     - Dịch vụ Phân quyền & Quản lý Slot          |
                  +--------------------------------------------------+


🚀 Công Nghệ Sử Dụng (Tech Stack)
Framework: React 18 (TypeScript)

Công cụ Build & HMR: Vite v8.x

Styling UI: Tailwind CSS v3 (Responsive đa màn hình Desktop & Mobile)

Hệ thống Icon: Lucide React

Truyền nhận dữ liệu: Axios (Chuẩn bị kết nối Backend API)

Mô hình tổ chức: Feature-Driven Architecture (Tách module độc lập tránh Git Conflict)


📂 Các Phân Hệ Chức Năng Đã Hoàn Thành (Frontend Modules)

Trang Chủ (Home):
    Giới thiệu các chương trình đào tạo Thạc sĩ năm 2026 (Kỹ thuật Phần mềm, Khoa học Máy tính, Quản trị Kinh doanh).
    Thẻ thống kê tổng quan và đường dẫn tắt điều hướng nhanh đến các dịch vụ.
Cổng Tuyển Sinh Trực Tuyến (Admission):
    Biểu mẫu thu thập dữ liệu cá nhân thí sinh và nguyện vọng chuyên ngành.
    Khu vực Upload tệp minh chứng tích hợp thuật toán kiểm tra dung lượng $\le$ 25MB trực tiếp tại Client.
Cổng Tra Cứu Kết Quả (Lookup):
    Tra cứu tức thì kết quả xét tuyển và giấy báo nhập học dựa trên số CCCD hoặc Mã hồ sơ.
Dashboard Học Viên & Cảnh Báo Luận Văn (Student Progress):
    Thẻ định danh học viên, đề tài nghiên cứu và giảng viên hướng dẫn.
    Giám sát các mốc quan trọng theo 3 trạng thái màu:
      🟢 Xanh lá: Hoàn thành đúng hạn (Thuyết minh đề cương).
      🟡 Vàng (Hiệu ứng chớp nháy): Cảnh báo sắp đến hạn (Báo cáo tiến độ & nộp Turnitin).
      🔴 Đỏ: Cảnh báo quá hạn (Nộp chuẩn đầu ra tiếng Anh VSTEP B2).
Cổng Quản Lý Slot Giảng Viên (Faculty):
    Thống kê hạn ngạch: Định mức tối đa, Số lượng đang hướng dẫn, Số slot còn lại.
    Danh sách sinh viên gửi yêu cầu hướng dẫn kèm chức năng phê duyệt/từ chối trực quan.


🛠️ Cấu Trúc Mã Nguồn (Source Tree)

agu-postgrad-frontend/
├── src/
│   ├── types/                     # Định nghĩa kiểu dữ liệu TypeScript (TabType, Milestone, ...)
│   ├── components/
│   │   ├── common/                # Thành phần dùng chung (FileUploadZone.tsx, ...)
│   │   └── layout/                # Khung giao diện (Navbar.tsx, Footer.tsx)
│   ├── features/
│   │   ├── home/                  # Giao diện Trang chủ (HomePage.tsx)
│   │   ├── admission/             # Phân hệ Tuyển sinh (RegisterPage.tsx)
│   │   ├── lookup/                # Phân hệ Tra cứu (ResultLookupPage.tsx)
│   │   ├── student/               # Phân hệ Học viên (StudentDashboard.tsx)
│   │   └── faculty/               # Phân hệ Giảng viên (FacultyDashboard.tsx)
│   ├── App.tsx                    # Điều phối Router và quản lý Tab cấp cao
│   ├── main.tsx                   # Điểm khởi chạy React DOM
│   └── index.css                  # Tích hợp cấu hình Tailwind CSS

⚙️ Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ (Local Setup)

Yêu cầu môi trường:
  Node.js (phiên bản 18.x trở lên)
  Trình quản lý gói npm

Các bước thực hiện:
  # 1. Điều hướng vào thư mục Frontend
cd agu-postgrad-frontend

# 2. Cài đặt các thư viện cần thiết
npm install

# 3. Chạy môi trường phát triển (Dev Server)
npm run dev