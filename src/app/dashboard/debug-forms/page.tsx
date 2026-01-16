'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function DebugFormsPage() {
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data, error } = await supabase.from('form_templates').select('*');
            if (data) setForms(data);
            if (error) console.error(error);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div>Loading DB...</div>;

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Debug: All Form Templates (DB Dump)</h1>
            <table className="w-full border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">ID</th>
                        <th className="border p-2">Title</th>
                        <th className="border p-2">Is Locked?</th>
                        <th className="border p-2">Deleted At</th>
                        <th className="border p-2">Type</th>
                    </tr>
                </thead>
                <tbody>
                    {forms.map(f => (
                        <tr key={f.id} className={f.deleted_at ? "bg-red-50 text-red-500" : ""}>
                            <td className="border p-2 text-xs">{f.id}</td>
                            <td className="border p-2">{f.title}</td>
                            <td className="border p-2">{f.is_locked ? 'YES' : 'NO'}</td>
                            <td className="border p-2">{f.deleted_at || '-'}</td>
                            <td className="border p-2">{f.type || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
