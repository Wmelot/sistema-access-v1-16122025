declare module 'vanilla-masker' {
    export function toPattern(value: number | string, pattern: string): string;
    export function toMoney(value: number | string, options?: any): string;
    export function toNumber(value: number | string): string;
    export function toAlphaNumeric(value: number | string): string;
}
