require('dotenv').config();

// Kiểm tra xem có cấu hình PostgreSQL / Supabase hay không (Codespaces hoặc Production)
const isPostgres = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);

let sql;
let poolPromise;

if (isPostgres) {
    const { Pool } = require('pg');
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    console.log('🌐 [Database] Phát hiện cấu hình PostgreSQL / Supabase, đang kết nối...');

    const pgPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const fakeSql = {
        Int: 'int',
        BigInt: 'bigint',
        VarChar: () => 'varchar',
        NVarChar: () => 'nvarchar',
        Bit: 'bit',
        Decimal: () => 'decimal',
        Date: 'date',
        DateTime: 'timestamp',
        Transaction: class PgTransaction {
            constructor() {
                this.client = null;
            }
            async begin() {
                this.client = await pgPool.connect();
                await this.client.query('BEGIN');
            }
            async commit() {
                if (this.client) {
                    await this.client.query('COMMIT');
                    this.client.release();
                    this.client = null;
                }
            }
            async rollback() {
                if (this.client) {
                    await this.client.query('ROLLBACK');
                    this.client.release();
                    this.client = null;
                }
            }
            request() {
                return new PgRequest(this.client || pgPool);
            }
        }
    };
    fakeSql.VarChar.MAX = 'max';
    fakeSql.NVarChar.MAX = 'max';

    class PgRequest {
        constructor(executor) {
            this.executor = executor;
            this.inputs = new Map();
        }

        input(name, type, value) {
            this.inputs.set(name, value);
            return this;
        }

        output() {
            return this;
        }

        async query(sqlString) {
            let transformed = sqlString;
            transformed = transformed.replace(/N'([^']*)'/g, "'$1'");

            let topLimit = null;
            transformed = transformed.replace(/SELECT\s+TOP\s*\(?(\d+)\)?/i, (match, n) => {
                topLimit = n;
                return 'SELECT';
            });

            transformed = transformed.replace(/\bISNULL\s*\(/gi, 'COALESCE(');
            transformed = transformed.replace(/\bGETDATE\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP');
            transformed = transformed.replace(/WITH\s*\(\s*UPDLOCK\s*,\s*HOLDLOCK\s*\)/gi, 'FOR UPDATE');
            transformed = transformed.replace(/\[([a-zA-Z0-9_]+)\]/g, '$1');

            const paramValues = [];
            let paramIndex = 1;
            transformed = transformed.replace(/@([a-zA-Z0-9_]+)\b/g, (match, paramName) => {
                if (this.inputs.has(paramName)) {
                    paramValues.push(this.inputs.get(paramName));
                    return `$${paramIndex++}`;
                }
                return match;
            });

            if (topLimit && !/\bLIMIT\s+\d+/i.test(transformed)) {
                transformed += ` LIMIT ${topLimit}`;
            }

            const res = await this.executor.query(transformed, paramValues);
            return {
                recordset: res.rows || [],
                recordsets: [res.rows || []],
                rowsAffected: [res.rowCount || 0]
            };
        }

        async execute(procName) {
            if (procName === 'sp_check_thesis_defense_gatekeeper') {
                const studentId = this.inputs.get('p_student_id');
                const res = await this.executor.query(
                    'SELECT * FROM sp_check_thesis_defense_gatekeeper($1)',
                    [studentId]
                );
                const row = res.rows[0] || { p_is_eligible: true, p_message: '' };
                return {
                    output: {
                        p_is_eligible: row.p_is_eligible,
                        p_message: row.p_message
                    }
                };
            }
            throw new Error(`Chưa hỗ trợ execute procedure: ${procName}`);
        }
    }

    sql = fakeSql;
    poolPromise = pgPool.connect().then(client => {
        client.release();
        console.log('✅ [Database] Đã kết nối thành công tới Supabase (PostgreSQL)!');
        return {
            request: () => new PgRequest(pgPool)
        };
    });
} else {
    // Chế độ Windows Local SQL Server
    try {
        sql = require('mssql/msnodesqlv8');
    } catch {
        sql = require('mssql');
    }

    const primaryConnectionString = `Driver={${process.env.DB_DRIVER || 'ODBC Driver 18 for SQL Server'}};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_NAME || 'agu_postgrad_db'};Trusted_Connection=yes;TrustServerCertificate=yes;`;
    const fallbackConnectionString = `Driver={${process.env.FALLBACK_DRIVER || 'SQL Server'}};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_NAME || 'agu_postgrad_db'};Trusted_Connection=yes;`;

async function ensureAdmissionProfileSchema(pool) {
    try {
        const columnCheck = await pool.request().query(`
            SELECT 1 AS exists_flag
            FROM sys.columns
            WHERE object_id = OBJECT_ID(N'dbo.admission_profiles')
              AND name = N'major_id'
        `);

        if (columnCheck.recordset.length === 0) {
            await pool.request().query(`
                ALTER TABLE [dbo].[admission_profiles]
                ADD [major_id] INT NULL;
            `);
            console.log('✅ [Database] Đã thêm cột major_id cho admission_profiles tự động.');
        }

        const fkCheck = await pool.request().query(`
            SELECT 1 AS exists_flag
            FROM sys.foreign_keys
            WHERE name = N'FK_profiles_majors'
              AND parent_object_id = OBJECT_ID(N'dbo.admission_profiles')
        `);

        if (fkCheck.recordset.length === 0) {
            await pool.request().query(`
                ALTER TABLE [dbo].[admission_profiles]
                ADD CONSTRAINT [FK_profiles_majors]
                    FOREIGN KEY ([major_id]) REFERENCES [dbo].[majors]([major_id]);
            `);
            console.log('✅ [Database] Đã thêm ràng buộc FK_profiles_majors cho admission_profiles tự động.');
        }
    } catch (error) {
        console.warn('⚠️ [Database] Không thể tự động cập nhật schema admission_profiles:', error.message);
    }
}

async function ensureTuitionPaymentSchema(pool) {
    const tableCheck = await pool.request().query(`
        SELECT OBJECT_ID(N'dbo.tuition_fees', N'U') AS table_id
    `);
    if (!tableCheck.recordset[0]?.table_id) {
        throw new Error('Không tìm thấy bảng dbo.tuition_fees để cập nhật chức năng biên lai học phí.');
    }

    const columnCheck = await pool.request().query(`
        SELECT name
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.tuition_fees')
          AND name IN (
              N'payment_slip_file',
              N'payment_slip_status',
              N'payment_slip_submitted_at',
              N'payment_slip_note'
          )
    `);
    const existingColumns = new Set(columnCheck.recordset.map(column => column.name));
    const requiredColumns = [
        'payment_slip_file',
        'payment_slip_status',
        'payment_slip_submitted_at',
        'payment_slip_note'
    ];
    const missingColumns = requiredColumns.filter(column => !existingColumns.has(column));

    if (missingColumns.length > 0) {
        await pool.request().query(`
            IF COL_LENGTH('dbo.tuition_fees', 'payment_slip_file') IS NULL
                ALTER TABLE [dbo].[tuition_fees] ADD [payment_slip_file] NVARCHAR(255) NULL;
            IF COL_LENGTH('dbo.tuition_fees', 'payment_slip_status') IS NULL
                ALTER TABLE [dbo].[tuition_fees] ADD [payment_slip_status] NVARCHAR(30) NULL;
            IF COL_LENGTH('dbo.tuition_fees', 'payment_slip_submitted_at') IS NULL
                ALTER TABLE [dbo].[tuition_fees] ADD [payment_slip_submitted_at] DATETIME NULL;
            IF COL_LENGTH('dbo.tuition_fees', 'payment_slip_note') IS NULL
                ALTER TABLE [dbo].[tuition_fees] ADD [payment_slip_note] NVARCHAR(500) NULL;
        `);
    }

    const constraintCheck = await pool.request().query(`
        SELECT 1 AS exists_flag
        FROM sys.check_constraints
        WHERE name = N'CK_tuition_payment_slip_status'
          AND parent_object_id = OBJECT_ID(N'dbo.tuition_fees')
    `);
    if (constraintCheck.recordset.length === 0) {
        await pool.request().query(`
            ALTER TABLE [dbo].[tuition_fees]
            ADD CONSTRAINT [CK_tuition_payment_slip_status]
                CHECK ([payment_slip_status] IS NULL OR [payment_slip_status] IN (N'Chờ xác nhận', N'Đã xác nhận', N'Từ chối'));
        `);
    }

    if (missingColumns.length > 0 || constraintCheck.recordset.length === 0) {
        console.log('✅ [Database] Đã cập nhật schema lưu biên lai học phí.');
    }
}

async function connectToDatabase() {
    let pool;
    try {
        pool = await new sql.ConnectionPool({ connectionString: primaryConnectionString }).connect();
        console.log('✅ [Database] Kết nối thành công tới SQL Server (agu_postgrad_db) qua Driver ODBC 18!');
    } catch (primaryError) {
        console.warn('⚠️ [Database] Lỗi kết nối Driver 18, chuyển sang Driver SQL Server mặc định...');
        try {
            pool = await new sql.ConnectionPool({ connectionString: fallbackConnectionString }).connect();
            console.log('✅ [Database] Kết nối thành công tới SQL Server qua Driver {SQL Server} mặc định!');
        } catch (fallbackError) {
            console.error('❌ [Database] Không thể kết nối SQL Server:', fallbackError.message);
            throw fallbackError;
        }
    }

    await ensureAdmissionProfileSchema(pool);
    await ensureTuitionPaymentSchema(pool);
    return pool;
}

    poolPromise = connectToDatabase().catch(error => {
        console.error('❌ [Database] Không thể cập nhật schema học phí:', error.message);
        throw error;
    });
}

// Helper ghi Audit Log nghiệp vụ nhạy cảm
async function writeAuditLog(userId, action, tableName, recordId, oldData, newData, ip) {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.BigInt, userId || null)
            .input('action', sql.NVarChar, action)
            .input('tableName', sql.VarChar, tableName)
            .input('recordId', sql.BigInt, recordId || null)
            .input('oldData', sql.NVarChar, oldData ? JSON.stringify(oldData) : null)
            .input('newData', sql.NVarChar, newData ? JSON.stringify(newData) : null)
            .input('ip', sql.VarChar, ip || '127.0.0.1')
            .query(`INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, ip_address)
                    VALUES (@userId, @action, @tableName, @recordId, @oldData, @newData, @ip)`);
    } catch (e) {
        console.error('Lỗi khi ghi Audit Log:', e.message);
    }
}

async function createNotification({ title, content, targetRoleId = null, targetUserId = null }) {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('title', sql.NVarChar(255), String(title || '').trim())
            .input('content', sql.NVarChar(sql.MAX), String(content || '').trim())
            .input('targetRoleId', sql.Int, targetRoleId)
            .input('targetUserId', sql.BigInt, targetUserId)
            .query(`
                INSERT INTO notifications (title, content, target_role_id, target_user_id, is_read)
                VALUES (@title, @content, @targetRoleId, @targetUserId, 0)
            `);
        return true;
    } catch (error) {
        console.error('Lỗi khi tạo thông báo:', error.message);
        return false;
    }
}

module.exports = {
    sql,
    poolPromise,
    writeAuditLog,
    createNotification
};

