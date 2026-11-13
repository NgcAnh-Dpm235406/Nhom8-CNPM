IF COL_LENGTH('dbo.admission_profiles', 'major_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[admission_profiles] ADD [major_id] INT NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE [name] = N'FK_profiles_majors'
      AND [parent_object_id] = OBJECT_ID(N'dbo.admission_profiles')
)
BEGIN
    ALTER TABLE [dbo].[admission_profiles]
    ADD CONSTRAINT [FK_profiles_majors]
        FOREIGN KEY ([major_id]) REFERENCES [dbo].[majors]([major_id]);
END;
