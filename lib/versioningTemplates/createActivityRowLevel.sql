--
-- Source:     https://github.com/kvesteri/postgresql-audit
-- License:    BSD 2-Clause "Simplified" License
-- Hash:       43e99f4(565)
--


CREATE OR REPLACE FUNCTION ${schema_prefix}create_activity() RETURNS TRIGGER AS $$
DECLARE
    audit_row ${schema_prefix}activity;
    excluded_cols text[] = ARRAY[]::text[];
BEGIN
    audit_row.id = nextval('${schema_prefix}activity_id_seq');
    audit_row.tableName = TG_TABLE_NAME::text;
    audit_row.issuedAt = statement_timestamp() AT TIME ZONE 'UTC';
    audit_row.transaction_id = (
        SELECT id
        FROM ${schema_prefix}transaction
        WHERE
            "nativeTransaction_id" = txid_current() AND
            "issuedAt" >= (NOW() - INTERVAL '1 hour')
        ORDER BY "issuedAt" DESC
        LIMIT 1
    );
    audit_row.verb = LOWER(TG_OP);
    audit_row.originalData = '{}'::jsonb;
    audit_row.changedData = '{}'::jsonb;

    IF TG_ARGV[0] IS NOT NULL THEN
        excluded_cols = TG_ARGV[0]::text[];
    END IF;

    IF (TG_OP = 'UPDATE' AND TG_LEVEL = 'ROW') THEN
        audit_row.originalData = row_to_json(OLD.*)::jsonb - excluded_cols;
        audit_row.changedData = (
            row_to_json(NEW.*)::jsonb - audit_row.originalData - excluded_cols
        );
        IF audit_row.changedData = '{}'::jsonb THEN
            -- All changed fields are ignored. Skip this update.
            RETURN NULL;
        END IF;
    ELSIF (TG_OP = 'DELETE' AND TG_LEVEL = 'ROW') THEN
        audit_row.originalData = row_to_json(OLD.*)::jsonb - excluded_cols;
    ELSIF (TG_OP = 'INSERT' AND TG_LEVEL = 'ROW') THEN
        audit_row.changedData = row_to_json(NEW.*)::jsonb - excluded_cols;
    END IF;
    INSERT INTO ${schema_prefix}activity VALUES (audit_row.*);
    RETURN NULL;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public;
