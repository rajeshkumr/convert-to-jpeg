# convert-to-jpeg

A utility that converts images — including **HEIC** — to JPEG. Supports PNG, JPG, GIF, BMP, WebP, and HEIC input formats with flexible output modes (file, Buffer, or array).

Works with both **Node.js** and **Bun**.

---

## Requirements

| Runtime | Minimum version |
|---------|----------------|
| [Node.js](https://nodejs.org) | ≥ 18.0.0 |
| [Bun](https://bun.sh) | ≥ 1.0.0 |
| TypeScript | ≥ 5.0 |

> Node.js ≥ 18.0.0 is required for native TypeScript support via `--experimental-strip-types`. For older Node versions, compile with `tsc` first.

---

## Installation

```bash
# npm
npm install convert-to-jpeg

# Bun
bun add convert-to-jpeg
```

---

## Supported Input Formats

| Format | Extension |
|--------|-----------|
| JPEG | `.jpg`, `.jpeg` |
| PNG | `.png` |
| GIF | `.gif` |
| BMP | `.bmp` |
| WebP | `.webp` |
| HEIC | `.heic` |

> Input must be a **file path string**. Passing a Buffer or stream directly is not supported — save to a temp file first if needed.

---

## Usage

### Basic — convert to file

```ts
import imageToJPEG from "convert-to-jpeg";

// Writes output.jpeg in the current working directory
const info = await imageToJPEG("./public/photo.png");
console.log(info);
// { format: 'jpeg', width: 1920, height: 1080, size: 204800, ... }
```

### Advanced — `convertor` with full options

```ts
import convertor from "convert-to-jpeg/convertor";

// Write to a custom path at a specific quality
const info = await convertor({
    input:      "./public/photo.png",
    fileName:   "./dist/photo.jpeg",
    outputType: "file",              // default
    quality:    85,                  // 1–100, default 90
});
```

#### Return a Buffer

```ts
const buffer = await convertor({
    input:      "./public/photo.heic",
    outputType: "toBuffer",
}) as Buffer;

// buffer starts with JPEG magic bytes: FF D8 FF
```

#### Return a raw pixel array

```ts
const array = await convertor({
    input:      "./public/photo.png",
    outputType: "toArray",
}) as unknown[];
```

#### Convert HEIC to JPEG

HEIC is decoded via `heic-decode` + `jpeg-js`, so it works without any native HEIC codec.

```ts
await convertor({
    input:    "./photos/iphone-shot.heic",
    fileName: "./output/iphone-shot.jpeg",
    quality:  90,
});
```

---

## API

### `imageToJPEG(input)`

Convenience wrapper around `convertor` that writes to `output.jpeg` in the current directory.

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | File path to the source image |

**Returns** `Promise<Output>`

---

### `convertor(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `input` | `string` | *(required)* | File path to the source image |
| `fileName` | `string` | `"output.jpeg"` | Destination path (used when `outputType` is `"file"`) |
| `outputType` | `"file"` \| `"toBuffer"` \| `"toArray"` | `"file"` | How the result is returned |
| `quality` | `number` | `90` | JPEG quality (1–100) |

**Returns** `Promise<Output>` where `Output` is:

| `outputType` | Return type |
|---|---|
| `"file"` | `OutputInfo` — contains `format`, `size`, `width`, `height` |
| `"toBuffer"` | `Buffer` — raw JPEG bytes |
| `"toArray"` | `unknown[]` — raw channel array |

---

## Error Handling

`convertor` validates the file extension before processing. Unsupported formats or missing extensions throw:

```ts
await convertor({ input: "photo.tiff" });
// → Error: Image is not a valid file. Please upload image with file extension

await convertor({ input: "does-not-exist.png" });
// → Error: ENOENT: no such file or directory
```

---

## Running Tests

Place test images in the `public/` folder:

| File | Required |
|------|----------|
| `public/test-image.png` | ✅ Required |
| `public/test-image.jpg` | Optional |
| `public/test-image.webp` | Optional |
| `public/test-image.heic` | Optional |

Tests for optional formats are skipped with a warning if the file is not present.

### Bun

```bash
bun test
# or explicitly:
bun run test:bun
```

### Node.js

Requires Node.js ≥ 22.6.0 and Jest:

```bash
npm install
npm run test:node
```

### Both

```bash
bun run test:all
```

Output files are written to `public/output/` and cleaned up automatically after the run.

### What is tested

| Suite | Tests |
|-------|-------|
| `imageToJPEG` | PNG, JPG, WebP conversion; unsupported extension throws; missing file throws |
| `convertor — file` | Default output name; custom file name; quality comparison; default quality fallback |
| `convertor — toBuffer` | PNG → Buffer (JPEG magic bytes verified); HEIC → Buffer |
| `convertor — toArray` | PNG → raw array |
| `convertor — HEIC` | HEIC → JPEG file |
| `convertor — validation` | Unsupported extension throws; no extension throws; missing file throws |

---

## Project Structure

```
convert-to-jpeg/
├── index.ts              # Public API — imageToJPEG()
├── utils/
│   └── convertor.ts      # Core converter — HEIC, toBuffer, toArray, file
├── index.test.ts         # Bun test suite
├── index.node.test.ts    # Node.js test suite (Jest)
├── types/
│   └── index.d.ts        # Global ambient types (Convertor, Output interfaces)
├── public/
│   ├── test-image.png    # Required test image
│   └── output/           # Generated during tests (auto-cleaned)
└── package.json
```

---

## License

MIT

## Contact

For any suggestions, issues or comments please feel free to reach out at [contact@rajeshkr.com](mailto:contact@rajeshkr.com)
