CREATE TABLE platform_metadata (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    installation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    schema_version INTEGER NOT NULL CHECK (schema_version > 0)
);

INSERT INTO platform_metadata (singleton, schema_version) VALUES (TRUE, 1);
