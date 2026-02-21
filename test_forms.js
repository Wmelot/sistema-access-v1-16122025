const url = 'https://robptuukezhqvtasjyhz.supabase.co/rest/v1/form_templates?select=id,title,type,is_locked,is_active';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0ODY3MDAsImV4cCI6MjA4MzA2MjcwMH0.K1BEPRBxnsxU8HpxqoqyrpYoHqjGa0WmiNt22LgizNg';

fetch(url, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
}).then(r => r.json()).then(data => {
    console.log(data);
});
