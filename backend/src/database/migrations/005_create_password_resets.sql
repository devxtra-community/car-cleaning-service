CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    reset_token_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
