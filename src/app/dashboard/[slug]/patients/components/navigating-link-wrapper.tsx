"use client"

import { useGlobalLoader } from "@/components/providers/global-loader-provider"
import { useRouter } from "next/navigation"

interface NavigatingLinkProps {
    href: string
    children: React.ReactNode
    className?: string
    message?: string
}

export function NavigatingLink({ href, children, className, message }: NavigatingLinkProps) {
    const { showLoading } = useGlobalLoader()
    const router = useRouter()

    const handleClick = (e: React.MouseEvent) => {
        // e.preventDefault() // Let the standard event flow if needed, but we want to show loader
        showLoading(message || "Abrindo...")
        // Next router.push is faster and we can control it
        router.push(href)
    }

    return (
        <a
            href={href}
            onClick={(e) => {
                e.preventDefault()
                handleClick(e)
            }}
            className={className}
        >
            {children}
        </a>
    )
}
