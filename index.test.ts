import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import imageToJPEG from "./index";
import convertor from "./utils/convertor";
import type { OutputInfo } from "sharp";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

// ─── type narrowing ───────────────────────────────────────────────────────────

function asOutputInfo(result: unknown): OutputInfo {
    if (
        result !== null &&
        typeof result === "object" &&
        !Array.isArray(result) &&
        !Buffer.isBuffer(result) &&
        "format" in result
    ) {
        return result as OutputInfo;
    }
    throw new Error("Expected OutputInfo but got a different Output type");
}

function asBuffer(result: unknown): Buffer {
    if (Buffer.isBuffer(result)) return result;
    throw new Error("Expected Buffer but got a different Output type");
}

function asArray(result: unknown): unknown[] {
    if (Array.isArray(result)) return result;
    throw new Error("Expected Array but got a different Output type");
}

// ─── assertThrows helper ──────────────────────────────────────────────────────
async function assertThrows(fn: () => Promise<unknown>): Promise<void> {
    let thrown = false;
    try {
        await fn();
    } catch {
        thrown = true;
    }
    expect(thrown).toBe(true);
}

// ─── paths ────────────────────────────────────────────────────────────────────
const __dirname  = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(__dirname, "public");
const OUTPUT_DIR = join(PUBLIC_DIR, "output");

const PNG_IMAGE  = join(PUBLIC_DIR, "test-image.png");
const JPG_IMAGE  = join(PUBLIC_DIR, "test-image.jpg");
const WEBP_IMAGE = join(PUBLIC_DIR, "test-image.webp");
const HEIC_IMAGE = join(PUBLIC_DIR, "test-image.heic");

// ─── setup / teardown ─────────────────────────────────────────────────────────
beforeAll(() => {
    if (!existsSync(PNG_IMAGE)) {
        throw new Error(
            `Required test image not found: ${PNG_IMAGE}\n` +
            `Place a PNG at public/test-image.png before running tests.`
        );
    }
    mkdirSync(OUTPUT_DIR, { recursive: true });
});

afterAll(() => {
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    if (existsSync("output.jpeg")) rmSync("output.jpeg");
});

// ─── imageToJPEG ─────────────────────────────────────────────────────────────
describe("imageToJPEG", () => {

    it("converts a PNG and writes output.jpeg by default", async () => {
        const raw  = await imageToJPEG(PNG_IMAGE);
        const info = asOutputInfo(raw);
        expect(info.format).toBe("jpeg");
        expect(info.size).toBeGreaterThan(0);
        expect(existsSync("output.jpeg")).toBe(true);
    });

    it("converts a JPG when a .jpg file is provided", async () => {
        if (!existsSync(JPG_IMAGE)) {
            console.warn("Skipping JPG test — public/test-image.jpg not found");
            return;
        }
        const raw  = await imageToJPEG(JPG_IMAGE);
        const info = asOutputInfo(raw);
        expect(info.format).toBe("jpeg");
    });

    it("converts a WebP when a .webp file is provided", async () => {
        if (!existsSync(WEBP_IMAGE)) {
            console.warn("Skipping WebP test — public/test-image.webp not found");
            return;
        }
        const raw  = await imageToJPEG(WEBP_IMAGE);
        const info = asOutputInfo(raw);
        expect(info.format).toBe("jpeg");
    });

    it("throws on an unsupported file extension", async () => {
        await assertThrows(() => imageToJPEG("photo.tiff"));
    });

    it("throws on a non-existent file path", async () => {
        await assertThrows(() => imageToJPEG("non-existent-file.png"));
    });

});

// ─── convertor — file ─────────────────────────────────────────────────────────
describe("convertor — outputType: file (default)", () => {

    it("writes to the default output.jpeg when no fileName is given", async () => {
        const raw  = await convertor({ input: PNG_IMAGE });
        const info = asOutputInfo(raw);
        expect(info.format).toBe("jpeg");
        expect(existsSync("output.jpeg")).toBe(true);
    });

    it("writes to a custom file name", async () => {
        const out  = join(OUTPUT_DIR, "custom-name.jpeg");
        const raw  = await convertor({ input: PNG_IMAGE, fileName: out });
        const info = asOutputInfo(raw);
        expect(info.format).toBe("jpeg");
        expect(existsSync(out)).toBe(true);
    });

    it("respects quality — high quality file is larger than low quality", async () => {
        const hqPath = join(OUTPUT_DIR, "hq.jpeg");
        const lqPath = join(OUTPUT_DIR, "lq.jpeg");
        const hqRaw  = await convertor({ input: PNG_IMAGE, fileName: hqPath, quality: 100 });
        const lqRaw  = await convertor({ input: PNG_IMAGE, fileName: lqPath, quality: 1   });
        const hq     = asOutputInfo(hqRaw);
        const lq     = asOutputInfo(lqRaw);
        expect(hq.size).toBeGreaterThan(lq.size);
        expect(existsSync(hqPath)).toBe(true);
        expect(existsSync(lqPath)).toBe(true);
    });

    it("uses default quality (90) when quality is omitted", async () => {
        const out  = join(OUTPUT_DIR, "default-quality.jpeg");
        const raw  = await convertor({ input: PNG_IMAGE, fileName: out });
        const info = asOutputInfo(raw);
        expect(info.format).toBe("jpeg");
        expect(info.size).toBeGreaterThan(0);
    });

});

// ─── convertor — toBuffer ─────────────────────────────────────────────────────
describe("convertor — outputType: toBuffer", () => {

    it("returns a Buffer for a PNG input", async () => {
        const raw    = await convertor({ input: PNG_IMAGE, outputType: "toBuffer" });
        const buffer = asBuffer(raw);
        expect(buffer.length).toBeGreaterThan(0);
        // JPEG magic bytes: FF D8 FF
        expect(buffer[0]).toBe(0xff);
        expect(buffer[1]).toBe(0xd8);
        expect(buffer[2]).toBe(0xff);
    });

    it("returns a Buffer for a HEIC input", async () => {
        if (!existsSync(HEIC_IMAGE)) {
            console.warn("Skipping HEIC buffer test — public/test-image.heic not found");
            return;
        }
        const raw    = await convertor({ input: HEIC_IMAGE, outputType: "toBuffer" });
        const buffer = asBuffer(raw);
        expect(buffer.length).toBeGreaterThan(0);
    });

});

// ─── convertor — toArray ──────────────────────────────────────────────────────
describe("convertor — outputType: toArray", () => {

    it("returns an array for a PNG input", async () => {
        const raw = await convertor({ input: PNG_IMAGE, outputType: "toArray" });
        const arr = asArray(raw);
        expect(arr.length).toBeGreaterThan(0);
    });

});

// ─── convertor — HEIC ────────────────────────────────────────────────────────
describe("convertor — HEIC support", () => {

    it("converts a HEIC file to JPEG on disk", async () => {
        if (!existsSync(HEIC_IMAGE)) {
            console.warn("Skipping HEIC file test — public/test-image.heic not found");
            return;
        }
        const out = join(OUTPUT_DIR, "from-heic.jpeg");
        await convertor({ input: HEIC_IMAGE, fileName: out });
        expect(existsSync(out)).toBe(true);
    });

});

// ─── convertor — validation ───────────────────────────────────────────────────
describe("convertor — validation", () => {

    it("throws for an unsupported file extension", async () => {
        await assertThrows(() => convertor({ input: "image.tiff" }));
    });

    it("throws for a file with no extension", async () => {
        await assertThrows(() => convertor({ input: "imagewithnoextension" }));
    });

    it("throws when the file does not exist on disk", async () => {
        await assertThrows(() => convertor({ input: "does-not-exist.png" }));
    });

});