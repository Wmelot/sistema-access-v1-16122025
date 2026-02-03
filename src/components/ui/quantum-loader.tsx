"use client";

import { useEffect, useState } from "react";
// @ts-ignore
import { quantum } from 'ldrs';

export const QuantumLoader = ({ size = "45", speed = "1.75", color = "black" }: { size?: string, speed?: string, color?: string }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        quantum.register();
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    // @ts-ignore
    return <l-quantum size={size} speed={speed} color={color} ></l-quantum>;
};
