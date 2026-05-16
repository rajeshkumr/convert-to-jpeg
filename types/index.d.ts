// No top-level import/export here — that would make this a module
// and scope all declarations, requiring explicit imports everywhere.
// By keeping this import-free, TypeScript treats it as an ambient
// declaration file and makes Convertor available globally.

interface Convertor {
    fileName?: string;
    input: string
    outputType?: string;
    quality?: number;
}

type Output = import("sharp").OutputInfo | any[] | Buffer<ArrayBufferLike> | void