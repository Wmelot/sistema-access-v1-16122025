"use client";

import { useEffect, useState } from "react";
import { getDraftRecords } from "@/actions/attendance";

export function DraftCountBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            const res = await getDraftRecords();
            if (res.success) {
                setCount(res.data?.length || 0);
            }
        };
        fetchCount();

        const handleUpdate = () => {
            console.log("[DraftCountBadge] Real-time update triggered");
            fetchCount();
        };

        window.addEventListener('draft-count-updated', handleUpdate);

        // Polling every 2 mins as safety
        const interval = setInterval(fetchCount, 120000);
        return () => {
            window.removeEventListener('draft-count-updated', handleUpdate);
            clearInterval(interval);
        };
    }, []);

    if (count === 0) return null;

    return (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
            {count > 9 ? '9+' : count}
        </span>
    );
}
