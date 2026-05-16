import convertor from "./utils/convertor";

export default async function imageToJPEG(input: string) {
    try {
        const result = await convertor({ input });
        return result;
    } catch (err) {
        console.error("Failed to convert image to jpeg");
        console.error(err);
        throw err;
    }
}
