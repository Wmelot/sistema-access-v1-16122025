export async function fetchCepCoordinateViaOpenSource(cep: string) {
    // 1. Buscamos a string do endereço via BrasilAPI (Free)
    const cleanCep = cep.replace(/\D/g, '');
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.location && data.location.coordinates && data.location.coordinates.longitude) {
        return {
            lat: data.location.coordinates.latitude,
            lng: data.location.coordinates.longitude,
            address: `${data.street}, ${data.neighborhood}, ${data.city} - ${data.state}`
        };
    }
    
    // Fallback: Tentamos o Nominatim (OpenStreetMap)
    const addressString = encodeURIComponent(`${data.street}, ${data.city} - ${data.state}, Brasil`);
    const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${addressString}`);
    const osmData = await osmRes.json();
    if (osmData && osmData.length > 0) {
        return {
            lat: parseFloat(osmData[0].lat),
            lng: parseFloat(osmData[0].lon),
            address: `${data.city} - ${data.state}`
        };
    }
    return null;
}
