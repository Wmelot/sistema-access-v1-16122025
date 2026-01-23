'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook for navigation with loading state
 * Provides instant visual feedback when user clicks navigation links
 */
export function useNavigationWithLoading() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [loadingPath, setLoadingPath] = useState<string | null>(null)

    const navigate = (path: string) => {
        setLoadingPath(path)
        startTransition(() => {
            router.push(path)
        })
    }

    const isNavigating = (path?: string) => {
        if (!path) return isPending
        return isPending && loadingPath === path
    }

    return {
        navigate,
        isPending,
        isNavigating,
        router
    }
}

/**
 * Hook for async actions with loading state
 * Provides visual feedback during server actions
 */
export function useAsyncAction<T extends any[], R>(
    action: (...args: T) => Promise<R>,
    options?: {
        onSuccess?: (result: R) => void
        onError?: (error: Error) => void
        successMessage?: string
        errorMessage?: string
    }
) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const execute = async (...args: T): Promise<R | undefined> => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await action(...args)
            options?.onSuccess?.(result)
            return result
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            options?.onError?.(error)
            return undefined
        } finally {
            setIsLoading(false)
        }
    }

    return {
        execute,
        isLoading,
        error,
        reset: () => {
            setIsLoading(false)
            setError(null)
        }
    }
}
