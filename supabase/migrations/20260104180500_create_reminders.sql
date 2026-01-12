-- Create reminders table
create table if not exists public.reminders (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    user_id uuid not null references auth.users(id) on delete cascade,
    creator_id uuid references auth.users(id) on delete set null,
    content text not null,
    due_date timestamp with time zone,
    is_read boolean not null default false,
    status text not null default 'pending', -- pending, read, resolved, snoozed
    
    constraint reminders_pkey primary key (id)
);

-- Enable RLS
alter table public.reminders enable row level security;

-- Policies
create policy "Users can view their own reminders"
    on public.reminders for select
    using (auth.uid() = user_id);

create policy "Users can insert reminders for themselves or others"
    on public.reminders for insert
    with check (true); -- Allow service role or authenticated users to create reminders for anyone (needed for waitlist logic)

create policy "Users can update their own reminders"
    on public.reminders for update
    using (auth.uid() = user_id);

create policy "Users can delete their own reminders"
    on public.reminders for delete
    using (auth.uid() = user_id);

-- Index for performance
create index if not exists reminders_user_id_idx on public.reminders(user_id);
create index if not exists reminders_due_date_idx on public.reminders(due_date);
