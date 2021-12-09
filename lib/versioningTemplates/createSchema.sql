--
-- Source:     https://github.com/kvesteri/postgresql-audit
-- License:    BSD 2-Clause "Simplified" License
-- Hash:       43e99f4(565)
--


CREATE SCHEMA ${schema_name};
REVOKE ALL ON SCHEMA ${schema_name} FROM public;
