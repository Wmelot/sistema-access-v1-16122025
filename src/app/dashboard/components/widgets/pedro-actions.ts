'use server'

import { unstable_cache } from "next/cache"

// URLs REAIS do sistema de updates do PEDro (descobertas via Browser Agent, usando HTTPS)
const CATEGORY_URLS: Record<string, string> = {
    musculoskeletal: 'https://search.pedro.org.au/update/subdiscipline/musculoskeletal',
    sports: 'https://search.pedro.org.au/update/subdiscipline/sports',
    gerontology: 'https://search.pedro.org.au/update/subdiscipline/gerontology',
    neurology: 'https://search.pedro.org.au/update/subdiscipline/neurology',
    cardiothoracics: 'https://search.pedro.org.au/update/subdiscipline/cardiothoracics',
    paediatrics: 'https://search.pedro.org.au/update/subdiscipline/paediatrics',
    orthopaedics: 'https://search.pedro.org.au/update/subdiscipline/orthopaedics'
}

export async function getPedroEvidence(categories: string[]) {
    const results: any[] = []

    for (const catId of categories) {
        const url = CATEGORY_URLS[catId]
        if (!url) continue

        try {
            const response = await fetch(url, {
                next: { revalidate: 3600 * 24 }, // Cache de 24 horas
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })

            if (!response.ok) {
                console.error(`PEDro fetch failed for ${catId}: ${response.status}`)
                continue
            }

            const html = await response.text()

            // Scraping mais robusto baseado em linhas
            // A estrutura é <tr><td><a href="..." class="left">Title</a></td>...</tr>

            const splitRows = html.split('<tr>')
            const foundInCat = []

            for (const row of splitRows) {
                // Regex para capturar link com class="left"
                const linkMatch = /<a[^>]+href=["']([^"']+)["'][^>]*class=["']left["'][^>]*>(.*?)<\/a>/i.exec(row)

                if (linkMatch) {
                    let href = linkMatch[1]
                    const text = linkMatch[2].replace(/<[^>]*>/g, '').trim()

                    if (text.length > 20) {
                        if (!href.startsWith('http')) {
                            if (href.startsWith('/')) {
                                href = `https://search.pedro.org.au${href}`
                            } else {
                                href = `https://search.pedro.org.au/${href}`
                            }
                        }

                        const cleanTitle = text
                            .replace(/\s+/g, ' ')
                            .replace(/&amp;/g, '&')
                            .replace(/&#8211;/g, '-')
                            .replace(/&#8217;/g, "'")

                        foundInCat.push({
                            title: cleanTitle,
                            link: href,
                            category: catId,
                            categoryLabel: getLabel(catId)
                        })
                    }
                }
            }

            // Pega os 3 primeiros (mais recentes)
            results.push(...foundInCat.slice(0, 3))

        } catch (error) {
            console.error(`Error fetching PEDro category ${catId}:`, error)
        }
    }

    return results
}

function getLabel(id: string) {
    const labels: Record<string, string> = {
        musculoskeletal: 'Musculoesquelética',
        sports: 'Esportiva',
        gerontology: 'Gerontologia',
        neurology: 'Neurologia',
        cardiothoracics: 'Cardiorrespiratória',
        paediatrics: 'Pediatria',
        orthopaedics: 'Ortopedia'
    }
    return labels[id] || id
}
