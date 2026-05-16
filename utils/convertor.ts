import { readFile, writeFile } from "fs";
import { promisify } from "util";
import sharp from "sharp";
import decode from "heic-decode";
import jpegjs from "jpeg-js";
import { existsSync } from "fs";

const defaultParams = {
    outputType: "file",
    fileName: "output.jpeg",
    quality: 90
}

export default async function convertor(params: Convertor): Promise<Output> {
    try {
        if (typeof params.input !== "string") {
            throw new Error("Image path should be valid string");
        }

        if (!existsSync(params.input)) {
            throw new Error("Image path or image does not exist");
        }

        const regexImageFormat = /\.(jpe?g|png|gif|bmp|webp|heic)$/i;
        if (regexImageFormat.test(params.input)) {
            const result = await transform(params);
            return result;
        } else {
            throw new Error("Image is not a valid file. Please upload image with file extension");
        }
    } catch (err) {
        throw err;
    }
}

async function transform(params: Convertor) {
    const quality = params.quality ?? defaultParams.quality;
    const outputFile = params.fileName ?? defaultParams.fileName;
    const type = params.outputType ?? defaultParams.outputType;
    const fileType = params.input.substring(params.input.lastIndexOf(".")).replace(".", "");
    if (fileType === "heic") {
        const buffer = await promisify(readFile)(params.input);
        const { width, height, data} = await decode({ buffer });
        const outputBuffer =  await jpegjs.encode({ data, width, height }, Math.floor(quality * 100)).data;
        switch (type) {
            case "toBuffer":
                return outputBuffer

            default: {
                return await promisify(writeFile)(outputFile, outputBuffer);
            }
        }
    } else {
        const input = sharp(params.input);
        const toJPEG = input.jpeg({ quality });
        const jpeg = toJPEG.jpeg({ quality: params.quality ?? defaultParams.quality });
        switch (type) {
            case "toArray":
                return await jpeg.toArray();

            case "toBuffer":
                return await jpeg.toBuffer();

            default: {
                return await jpeg.toFile(outputFile);
            }
        }
    }
}