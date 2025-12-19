"use strict";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DebugPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        async function load() {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('type', 'block')
                .order('start_time', { ascending: false })
                .limit(20);

            if (data) setAppointments(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Debug Blocks</h1>
            <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto max-h-[800px]">
                {JSON.stringify(appointments, null, 2)}
            </pre>
        </div>
    );
}
