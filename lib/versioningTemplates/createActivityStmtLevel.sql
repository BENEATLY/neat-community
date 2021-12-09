--
-- Source:     https://github.com/kvesteri/postgresql-audit
-- License:    BSD 2-Clause "Simplified" License
-- Hash:       43e99f4(565)
--


CREATE OR REPLACE FUNCTION ${schema_prefix}create_activity() RETURNS TRIGGER AS $$
DECLARE
    audit_row ${schema_prefix}activity;
    excluded_cols text[] = ARRAY[]::text[];
    _transaction_id BIGINT;
BEGIN
    _transaction_id := (
        SELECT id
        FROM ${schema_prefix}transaction
        WHERE
            "nativeTransaction_id" = txid_current() AND
            "issuedAt" >= (NOW() - INTERVAL '1 day')
        ORDER BY "issuedAt" DESC
        LIMIT 1
    );

    IF TG_ARGV[0] IS NOT NULL THEN
        excluded_cols = TG_ARGV[0]::text[];
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO ${schema_prefix}activity(
            id, "tableName", "issuedAt",
            "verb", "originalData", "changedData", "transaction_id")
        SELECT
            nextval('${schema_prefix}activity_id_seq') as id,
            TG_TABLE_NAME::text AS "tableName",
            statement_timestamp() AT TIME ZONE 'UTC' AS "issuedAt",
            LOWER(TG_OP) AS "verb",
            "originalData" - excluded_cols AS "originalData",
            new_data - "originalData" - excluded_cols AS "changedData",
            _transaction_id AS "transaction_id"
        FROM (
            SELECT *
            FROM (
                SELECT
                    row_to_json(old_table.*)::jsonb AS "originalData",
                    row_number() OVER ()
                FROM old_table
            ) AS old_table
            JOIN (
                SELECT
                    row_to_json(new_table.*)::jsonb AS new_data,
                    row_number() OVER ()
                FROM new_table
            ) AS new_table
            USING(row_number)
        ) as sub
        WHERE new_data - "originalData" - excluded_cols != '{}'::jsonb;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO ${schema_prefix}activity(
            id, "tableName", "issuedAt",
            "verb", "originalData", "changedData", "transaction_id")
        SELECT
            nextval('${schema_prefix}activity_id_seq') as id,
            TG_TABLE_NAME::text AS "tableName",
            statement_timestamp() AT TIME ZONE 'UTC' AS "issuedAt",
            LOWER(TG_OP) AS "verb",
            '{}'::jsonb AS "originalData",
            row_to_json(new_table.*)::jsonb - excluded_cols AS "changedData",
            _transaction_id AS "transaction_id"
        FROM new_table;
    ELSEIF TG_OP = 'DELETE' THEN
        INSERT INTO ${schema_prefix}activity(
            id, "tableName", "issuedAt",
            "verb", "originalData", "changedData", "transaction_id")
        SELECT
            nextval('${schema_prefix}activity_id_seq') as id,
            TG_TABLE_NAME::text AS "tableName",
            statement_timestamp() AT TIME ZONE 'UTC' AS "issuedAt",
            LOWER(TG_OP) AS "verb",
            row_to_json(old_table.*)::jsonb - excluded_cols AS "originalData",
            '{}'::jsonb AS "changedData",
            _transaction_id AS "transaction_id"
        FROM old_table;
    END IF;
    RETURN NULL;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public;
