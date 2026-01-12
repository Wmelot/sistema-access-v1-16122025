
export function maskName(name: string): string {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length <= 1) return name; // Single name, can't mask much without hiding it all.
    // Show first name, mask middle/last with initial + *
    return parts.map((part, index) => {
        if (index === 0) return part; // First name visible
        return part[0] + "***";
    }).join(" ");
}

export function maskCPF(cpf: string): string {
    if (!cpf) return "";
    // Format: 123.456.789-00 -> ***.456.***-**
    // Or just keep middle chars.
    // Simple mask: show last 2 digits?? Or middle? 
    // Standard: ***.456.***-**
    return "***.***." + cpf.slice(-2);
    // Wait, standard is usually showing first 3 or middle 3.
    // Let's do: ***.456.***-** (assuming input assumes formatting or raw)
    const raw = cpf.replace(/\D/g, "");
    if (raw.length !== 11) return "***.***.***-**";
    return `***.${raw.slice(3, 6)}.***-**`;
}

export function maskPhone(phone: string): string {
    if (!phone) return "";
    // (11) 91234-5678 -> (11) 9****-5678
    const raw = phone.replace(/\D/g, "");
    if (raw.length < 10) return "(**) ****-****";
    const ddd = raw.slice(0, 2);
    const last4 = raw.slice(-4);
    return `(${ddd}) *****-${last4}`;
}
