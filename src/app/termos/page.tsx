import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { TermsContent } from '@/components/terms-content'

export default function TermosPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Cadastro
                </Link>

                <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-emerald-500" />
                            <div>
                                <CardTitle className="text-2xl text-white">Termos e Condições de Uso</CardTitle>
                                <p className="text-sm text-slate-400 mt-1">
                                    Última atualização: 20 de janeiro de 2026
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[600px] pr-4">
                            <TermsContent />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
