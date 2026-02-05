"use client"

import Link from "next/link"
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
        e.preventDefault()
        showLoading(message || "Abrindo...")
        router.push(href)
    }

    return (
        <a href={href} onClick={handleClick} className={className}>
            {children}
        </a>
    )
}
