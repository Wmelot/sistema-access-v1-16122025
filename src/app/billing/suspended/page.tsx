import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function SuspendedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <Card className="w-full max-w-md border-red-200 shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl text-zinc-900">Acesso Suspenso</CardTitle>
                    <CardDescription className="text-zinc-600 mt-2">
                        O acesso à sua conta foi temporariamente suspenso.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-center text-zinc-500">
                        Isso pode ter ocorrido devido a pendências financeiras ou violação dos termos de uso.
                        Para restaurar o acesso, entre em contato com a administração.
                    </p>

                    <div className="bg-zinc-100 p-3 rounded-md flex items-center justify-center text-sm font-medium text-zinc-700 gap-2">
                        <Mail className="w-4 h-4" />
                        suporte@accessfisio.com
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center flex-col gap-2">
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/login">Voltar para Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
