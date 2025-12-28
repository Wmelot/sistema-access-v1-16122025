-- Grant permissions and notify
GRANT ALL ON TABLE public.message_templates TO service_role;
GRANT ALL ON TABLE public.message_templates TO postgres;
GRANT ALL ON TABLE public.message_templates TO anon;
GRANT ALL ON TABLE public.message_templates TO authenticated;

NOTIFY pgrst, 'reload config';
