export const maskName = (name: string) => {
    if (!name) return ''
    const parts = name.split(' ')
    return parts.map(p => p[0] + '*'.repeat(Math.max(0, p.length - 1))).join(' ')
}

export const maskCPF = (cpf: string) => {
    if (!cpf) return ''
    return '***.***.***-**'
}

export const maskPhone = (phone: string) => {
    if (!phone) return ''
    return '(**) *****-****'
}

export const maskContent = (content: string) => {
    if (!content) return ''
    return '[CONTEÚDO PROTEGIDO - VISUALIZAÇÃO RESTRITA À CLÍNICA]'
}
