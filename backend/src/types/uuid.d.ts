declare module 'uuid' {
    export function v4(options?: { random?: number[]; rng?: () => number[] }, buf?: Buffer | Uint8Array, offset?: number): string;
    export function v1(options?: { node?: number[]; clockseq?: number; msecs?: number; nsecs?: number; random?: number[]; rng?: () => number[] }, buf?: Buffer | Uint8Array, offset?: number): string;
    export function v3(name: string | Buffer, namespace: string | Buffer, buf?: Buffer | Uint8Array, offset?: number): string;
    export function v5(name: string | Buffer, namespace: string | Buffer, buf?: Buffer | Uint8Array, offset?: number): string;
    export function validate(uuid: string): boolean;
    export function version(uuid: string): number;
    export function parse(uuid: string): Uint8Array;
    export function stringify(arr: Uint8Array, offset?: number): string;
    export function NIL(): string;
}
