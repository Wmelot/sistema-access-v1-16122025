
export const extractNumber = (str: any) => {
    if (!str) return 0;
    const normalized = str.toString().replace(/[\u2013\u2014]/g, "-").replace(",", ".");
    const match = normalized.match(/(-?)\s*(\d+(\.\d+)?)/);
    if (match) {
        const sign = match[1] === "-" ? "-" : "";
        const num = match[2];
        return parseFloat(sign + num);
    }
    return 0;
};
