import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cep = searchParams.get('cep');

        if (!cep) {
            return NextResponse.json({ success: false, error: 'CEP não informado' }, { status: 400 });
        }

        const cleanCep = cep.replace(/\D/g, '');

        // 1. Buscamos a string do endereço via BrasilAPI (Free)
        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        if (!res.ok) {
            return NextResponse.json({ success: false, error: 'CEP não encontrado ou inválido.' }, { status: 404 });
        }

        const data = await res.json();
        let lat = null;
        let lng = null;
        let formattedAddress = `${data.neighborhood || ''}, ${data.city || ''} - ${data.state || ''}`;

        // 2. Se a BrasilAPI já trouxer coordenadas nativas:
        if (data.location && data.location.coordinates && data.location.coordinates.longitude) {
            lat = Number(data.location.coordinates.latitude);
            lng = Number(data.location.coordinates.longitude);
        } else {
            // 3. Fallback: Tentamos o Nominatim (OpenStreetMap Free) 
            // Buscamos pelo nome da cidade pra centralizar o raio!
            const addressString = encodeURIComponent(`${formattedAddress}, Brasil`);
            const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${addressString}`, {
                headers: { 'User-Agent': 'AxiomPropulsaoB2B/1.0' }
            });
            const osmData = await osmRes.json();

            if (osmData && osmData.length > 0) {
                lat = parseFloat(osmData[0].lat);
                lng = parseFloat(osmData[0].lon);
            }
        }

        if (lat === null || lng === null) {
            return NextResponse.json({ success: false, error: 'Sem coordenadas para este CEP' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            lat,
            lng,
            address: formattedAddress
        });

    } catch (e: any) {
        console.error('Geocode API Error:', e);
        return NextResponse.json({ success: false, error: 'Erro interno ao consultar o endereço' }, { status: 500 });
    }
}
