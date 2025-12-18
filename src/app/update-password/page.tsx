import { updatePassword } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from 'next/image'

export default async function UpdatePasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const params = await searchParams
    return (
        <div className="flex min-h-screen bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-24 w-24 relative mb-4">
                    <Image src="/logo_login.png" alt="Access Logo" fill className="object-contain" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Definir Nova Senha
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" action={updatePassword}>
                        {params?.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>{params.error}</AlertDescription>
                            </Alert>
                        )}

                        <div>
                            <Label htmlFor="password">Nova Senha</Label>
                            <div className="mt-1">
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="bg-gray-50"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <div className="mt-1">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="bg-gray-50"
                                />
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full">
                                Atualizar Senha
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
