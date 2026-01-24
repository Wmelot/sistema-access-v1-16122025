import { createClient } from './src/lib/supabase/server';
import { getPriceTableItems } from './src/app/dashboard/[slug]/prices/actions';

async function test() {
    try {
        const items = await getPriceTableItems('b3015fe8-6ac2-424f-a804-4091571ae32c');
        console.log('Items:', items.length);
    } catch (e: any) {
        console.error('Action Error:', e);
    }
}
// test();
