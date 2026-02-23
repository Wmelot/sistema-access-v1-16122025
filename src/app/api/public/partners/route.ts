import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const latStr = searchParams.get('lat');
        const lngStr = searchParams.get('lng');
        const radiusStr = searchParams.get('radius') || '50';
        const radius = Number(radiusStr);

        const lat = latStr ? Number(latStr) : null;
        const lng = lngStr ? Number(lngStr) : null;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Busca apenas Parceiros Oficiais Ativos
        const { data: professionals, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_propulsao_partner', true)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

        if (profError) {
            console.error("Partner Fetch Error:", profError.message);
            return NextResponse.json({ success: false, error: profError.message }, { status: 500 });
        }

        let partnersResult = [];

        // Haversine distance calc for each partner
        for (const prof of professionals || []) {
            const pLat = prof.latitude;
            const pLng = prof.longitude;
            let distance = null;

            if (lat !== null && lng !== null && pLat !== null && pLng !== null) {
                // Haversine
                const R = 6371;
                const dLat = (pLat - lat) * Math.PI / 180;
                const dLon = (pLng - lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                distance = R * c;
            }

            if (distance === null || distance <= radius) {
                // Fetch the clinic just minimal info
                let clinicaName = "Clínica Licenciada Propulsão";
                let endereco = `CEP: ${prof.cep || 'Propulsão'}`;

                if (prof.organization_id) {
                    const { data: orgData } = await supabase.from('organizations').select('name, address').eq('id', prof.organization_id).single();
                    if (orgData) {
                        clinicaName = orgData.name || clinicaName;
                        if (orgData.address) {
                            endereco = orgData.address;
                        }
                    }
                }

                partnersResult.push({
                    profissional: prof.full_name || 'Especialista',
                    clinica: clinicaName,
                    endereco: endereco,
                    cep: prof.cep,
                    coords: { lat: pLat, lng: pLng },
                    agenda_id: prof.id,
                    distance: distance !== null ? parseFloat(distance.toFixed(1)) : null
                });
            }
        }

        // Sort by distance if calculated, then randomize amongst close ones
        partnersResult = partnersResult.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        // Randomize first 3 if they are very close (< 2km difference) to be fair, 
        // or just shuffle everything if count > 1 to give everyone a chance
        if (partnersResult.length > 1) {
            partnersResult = partnersResult.sort(() => Math.random() - 0.5);
        }

        return NextResponse.json({ success: true, count: partnersResult.length, partners: partnersResult });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
