'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { LoadingDots } from './loading-dots'

/**
 * Global Loading Bar - Appears at top of screen during navigation
 * Elegant, minimal, and provides instant feedback
 */
export function NavigationLoadingBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Start loading
        setLoading(true)
        setProgress(20)

        // Simulate progress
        const timer1 = setTimeout(() => setProgress(40), 100)
        const timer2 = setTimeout(() => setProgress(60), 300)
        const timer3 = setTimeout(() => setProgress(80), 600)

        // Complete loading
        const completeTimer = setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
                setLoading(false)
                setProgress(0)
            }, 200)
        }, 1000)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
            clearTimeout(completeTimer)
        }
    }, [pathname, searchParams])

    if (!loading && progress === 0) return null

    return (
        <div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-[9999] transition-all duration-300 ease-out"
            style={{
                width: `${progress}%`,
                opacity: loading ? 1 : 0,
            }}
        >
            <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-transparent to-white/30 animate-pulse" />
        </div>
    )
}

/**
 * Loading Spinner - For inline loading states
 */
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
    return (
        <LoadingDots className={className} />
    )
}

/**
 * Loading Overlay - For full-page loading
 */
export function LoadingOverlay({ message = 'Carregando...' }: { message?: string }) {
    return (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[9998] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <LoadingDots className="text-primary h-12 w-12 scale-150" />
                <p className="text-slate-800 font-bold text-lg animate-pulse">{message}</p>
            </div>
        </div>
    )
}

/**
 * Skeleton Loader - For content placeholders
 */
export function Skeleton({ className = '', variant = 'default' }: { className?: string, variant?: 'default' | 'card' | 'text' | 'circle' }) {
    const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]'

    const variantClasses = {
        default: 'rounded',
        card: 'rounded-xl',
        text: 'rounded h-4',
        circle: 'rounded-full'
    }

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} style={{
            animation: 'shimmer 2s infinite'
        }}>
            <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
        </div>
    )
}

/**
 * Card Skeleton - For loading cards
 */
export function CardSkeleton() {
    return (
        <div className="bg-white border rounded-xl p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" variant="text" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-5/6" variant="text" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
            </div>
        </div>
    )
}

/**
 * Table Skeleton - For loading tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white border rounded-lg">
                    <Skeleton className="h-10 w-10" variant="circle" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" variant="text" />
                        <Skeleton className="h-3 w-1/2" variant="text" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                </div>
            ))}
        </div>
    )
}
