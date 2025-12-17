-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- The recipient/owner
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who created it
    content TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own reminders
CREATE POLICY "Users can view their own reminders" ON reminders
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create reminders (for themselves or others if permitted - logic handled in app, simple RLS here)
CREATE POLICY "Users can create reminders" ON reminders
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policy: Users can update their own reminders (mark as read)
CREATE POLICY "Users can update their own reminders" ON reminders
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reminders
CREATE POLICY "Users can delete their own reminders" ON reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
