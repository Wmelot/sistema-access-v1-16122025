import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function IntegrationsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let isConnected = false;

    if (user) {
        const { data } = await supabase
            .from('professional_integrations')
            .select('id')
            .eq('profile_id', user.id)
            .eq('provider', 'google_calendar')
            .single();

        isConnected = !!data;
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">Integrações</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">Google Calendar</CardTitle>
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2 my-4">
                            {isConnected ? (
                                <>
                                    <CheckCircle className="text-green-500 h-5 w-5" />
                                    <span className="text-sm font-medium">Conectado</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="text-red-500 h-5 w-5" />
                                    <span className="text-sm font-medium">Não conectado</span>
                                </>
                            )}
                        </div>

                        <CardDescription className="mb-4">
                            Sincronize seus agendamentos automaticamente com sua agenda do Google.
                        </CardDescription>

                        {isConnected ? (
                            <div className="flex space-x-2">
                                <Button variant="outline" disabled>
                                    Configurações (Em breve)
                                </Button>
                                {/* Add disconnect logic later if needed */}
                            </div>
                        ) : (
                            <Link href="/api/google/auth">
                                <Button className="w-full">
                                    Conectar Google Calendar
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
