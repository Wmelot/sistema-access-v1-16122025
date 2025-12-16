
/**
 * Simple OFX Parser
 * Extracts transactions from OFX content string.
 */

export interface OFXTransaction {
    type: 'DEBIT' | 'CREDIT'
    date: Date
    amount: number
    fitId: string
    description: string
    memo?: string
}

export function parseOFX(ofxContent: string): OFXTransaction[] {
    const transactions: OFXTransaction[] = []

    // Very basic regex parser. 
    // OFX is SGML/XML-like but often dirty.
    // We look for <STMTTRN> blocks.

    // 1. Split into transactions
    const rawTrans = ofxContent.split('<STMTTRN>')
    // Remove header (first element usually)
    rawTrans.shift()

    for (const block of rawTrans) {
        try {
            // Extract fields
            const typeMatch = /<TRNTYPE>(.*?)(\r|\n|<)/.exec(block)
            const dateMatch = /<DTPOSTED>(.*?)(\r|\n|<)/.exec(block)
            const amtMatch = /<TRNAMT>(.*?)(\r|\n|<)/.exec(block)
            const idMatch = /<FITID>(.*?)(\r|\n|<)/.exec(block) // Financial Institution Transaction ID
            const descMatch = /<MEMO>(.*?)(\r|\n|<)/.exec(block) || /<NAME>(.*?)(\r|\n|<)/.exec(block)

            if (dateMatch && amtMatch && idMatch) {
                // Parse Date: YYYYMMDDHHMM...
                const dStr = dateMatch[1].trim()
                const date = new Date(
                    parseInt(dStr.slice(0, 4)),
                    parseInt(dStr.slice(4, 6)) - 1,
                    parseInt(dStr.slice(6, 8))
                )

                // Parse Amount
                const amount = parseFloat(amtMatch[1].replace(',', '.'))

                const fitIdRaw = idMatch ? idMatch[1].trim() : ''
                // Fallback ID if missing
                const fitId = fitIdRaw || `GEN_${date.getTime()}_${amount}_${descMatch ? descMatch[1].trim().slice(0, 10) : 'nodesc'}`

                transactions.push({
                    type: amount < 0 ? 'DEBIT' : 'CREDIT',
                    date,
                    amount,
                    fitId,
                    description: descMatch ? descMatch[1].trim() : 'Sem descrição'
                })
            }
        } catch (e) {
            console.warn("Failed to parse OFX block", e)
        }
    }

    return transactions
}
