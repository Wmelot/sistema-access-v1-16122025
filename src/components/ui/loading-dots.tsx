'use client'

export function LoadingDots({ className = "" }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`}>
            <span className="w-1 h-1 bg-current rounded-full animate-[bounce_1s_infinite_0ms]" />
            <span className="w-1 h-1 bg-current rounded-full animate-[bounce_1s_infinite_200ms]" />
            <span className="w-1 h-1 bg-current rounded-full animate-[bounce_1s_infinite_400ms]" />
        </span>
    )
}
