
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0ODY3MDAsImV4cCI6MjA4MzA2MjcwMH0.K1BEPRBxnsxU8HpxqoqyrpYoHqjGa0WmiNt22LgizNg'
);

async function testAuth() {
    console.log('Testing Auth API connectivity...');
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'wmelot@gmail.com',
            password: 'Password123!'
        });
        if (error) {
            console.log('Auth Error (expected if password wrong):', error.message);
        } else {
            console.log('Auth Success!');
        }
    } catch (err) {
        console.error('CRITICAL Auth API Failure:', err);
    }
}

testAuth();
