IF COL_LENGTH('dbo.tuition_fees', 'payment_slip_file') IS NULL
    ALTER TABLE [dbo].[tuition_fees] ADD [payment_slip_file] NVARCHAR(255) NULL;

IF COL_LENGTH('dbo.tuition_fees', 'payment_slip_status') IS NULL
    ALTER TABLE [dbo].[tuition_fees] ADD [payment_slip_status] NVARCHAR(30) NULL;

IF COL_LENGTH('dbo.tuition_fees', 'payment_slip_submitted_at') IS NULL
    ALTER TABLE [dbo].[tuition_fees] ADD [payment_slip_submitted_at] DATETIME NULL;

IF COL_LENGTH('dbo.tuition_fees', 'payment_slip_note') IS NULL
    ALTER TABLE [dbo].[tuition_fees] ADD [payment_slip_note] NVARCHAR(500) NULL;

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE [name] = N'CK_tuition_payment_slip_status'
      AND [parent_object_id] = OBJECT_ID(N'dbo.tuition_fees')
)
BEGIN
    ALTER TABLE [dbo].[tuition_fees]
    ADD CONSTRAINT [CK_tuition_payment_slip_status]
        CHECK ([payment_slip_status] IS NULL OR [payment_slip_status] IN (N'Chờ xác nhận', N'Đã xác nhận', N'Từ chối'));
END;
