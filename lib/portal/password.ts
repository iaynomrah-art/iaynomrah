import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "crypto";

// Owner portal password hashing with Node's built-in scrypt.
// Stored format: scrypt$N$r$p$<salt base64>$<hash base64>

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

export const MIN_PASSWORD_LENGTH = 8;

function scryptAsync(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, keyLength, options, (err, key) => (err ? reject(err) : resolve(key)));
    });
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await scryptAsync(password, salt, KEY_LENGTH, { N, r: R, p: P });
    return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
    // Always do the scrypt work, even with no stored hash, so a missing account
    // takes as long to reject as a wrong password.
    const parts = (stored || "").split("$");
    const valid = parts.length === 6 && parts[0] === "scrypt";
    const [n, r, p] = valid ? parts.slice(1, 4).map(Number) : [N, R, P];
    const salt = valid ? Buffer.from(parts[4], "base64") : randomBytes(16);
    const expected = valid ? Buffer.from(parts[5], "base64") : randomBytes(KEY_LENGTH);

    const actual = await scryptAsync(password, salt, expected.length, { N: n, r, p });
    return valid && timingSafeEqual(actual, expected);
}
