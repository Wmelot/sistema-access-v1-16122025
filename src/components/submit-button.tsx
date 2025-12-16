"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export function SubmitButton({ children, text = "Salvar", className, ...props }: any) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className={className} {...props}>
            {pending ? "Aguarde..." : (children || text)}
        </Button>
    )
}
