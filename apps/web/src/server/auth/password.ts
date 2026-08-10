import { hash, verify } from "@node-rs/argon2";

const options = { algorithm: 2, memoryCost: 65_536, timeCost: 3, parallelism: 1, outputLen: 32 } as const;
export const hashPassword = (password: string) => hash(password, options);
export const verifyPassword = (hashValue: string, password: string) => verify(hashValue, password, options);
