// Readable random password for an admin to hand over (no 0/O, 1/l/I look-alikes).
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 12): string {
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (n) => ALPHABET[n % ALPHABET.length]).join("");
}
