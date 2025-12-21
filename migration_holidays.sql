-- Create holidays table if not exists
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('national', 'state', 'city')), -- national, state, city
    is_mandatory BOOLEAN DEFAULT TRUE, -- TRUE = Blocks agenda, FALSE = Optional/Yellow
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique constraint to prevent duplicate holidays
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'holidays_date_name_key') THEN 
        ALTER TABLE holidays ADD CONSTRAINT holidays_date_name_key UNIQUE (date, name); 
    END IF;
END $$;
