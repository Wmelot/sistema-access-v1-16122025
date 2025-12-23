'use server'

import HTMLtoDOCX from 'html-to-docx'

export async function generateDocx(htmlContent: string) {
    try {
        const fileBuffer = await HTMLtoDOCX(htmlContent, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
        })

        return {
            success: true,
            base64: fileBuffer.toString('base64')
        }
    } catch (error) {
        console.error('Error generating DOCX:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
