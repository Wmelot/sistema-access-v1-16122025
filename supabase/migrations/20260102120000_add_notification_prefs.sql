alter table profiles 
add column if not exists notify_whatsapp boolean default true,
add column if not exists notify_email boolean default true,
add column if not exists notify_sms boolean default false;
