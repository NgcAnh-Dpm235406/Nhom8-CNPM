# CSDL Hệ thống Quản lý Đào tạo Sau Đại học AGU (agu_postgrad_db)

Hệ quản trị cơ sở dữ liệu: **Microsoft SQL Server (T-SQL)**.

## 1. File kịch bản khởi tạo
- [`schema_and_seed.sql`](./schema_and_seed.sql) (hoặc file gốc [`../SQLQuery2.sql`](../SQLQuery2.sql)).
- Tự động xóa CSDL cũ nếu tồn tại (`DROP DATABASE agu_postgrad_db`), khởi tạo 21 bảng quan hệ, ràng buộc RBAC, triggers, stored procedures và nạp dữ liệu mẫu (seed data) thực tế của Trường Đại học An Giang.
- Khi cần nâng cấp CSDL đã có dữ liệu, chạy riêng migration [`migrations/add_admission_profile_major_id.sql`](./migrations/add_admission_profile_major_id.sql); không chạy lại script khởi tạo vì script đó xóa database.
- Để lưu biên lai chuyển khoản học phí trên database hiện có, chạy migration [`migrations/add_tuition_payment_slip.sql`](./migrations/add_tuition_payment_slip.sql) một lần.
- Ở phiên bản hiện tại, backend sẽ tự kiểm tra và bổ sung cột `major_id` / khóa ngoại `FK_profiles_majors` nếu database cũ chưa cập nhật, nên không cần chạy migration thủ công ở lần đầu dùng.
- API đăng ký chỉ trả về đợt tuyển sinh có ngày hiện tại nằm trong `start_date`–`end_date`; dữ liệu seed hiện có là đợt năm 2024 đã đóng, nên hãy tạo/cập nhật đợt phù hợp trước khi thử nộp hồ sơ.

## 2. Các Stored Procedures quan trọng
- `sp_check_thesis_defense_gatekeeper`: Chốt chặn Gatekeeper kiểm tra 4 điều kiện bảo vệ luận văn (Học phí = 0, Turnitin ≤ 20%, ≥ 1 bài báo khoa học Đạt, chứng chỉ ngoại ngữ VSTEP B2/IELTS 5.5+ Đạt).
- `sp_calculate_defense_final_grade`: Tự động tính điểm trung bình khi 5 thành viên hội đồng chấm độc lập (Điểm TB ≥ 5.50 là Đạt).

## 3. Trigger nghiệp vụ
- `trg_check_lecturer_degree_before_assignment`: Ngăn chặn phân công giảng viên dạy hoặc hướng dẫn Thạc sĩ nếu chưa đạt chuẩn học vị Tiến sĩ trở lên.
