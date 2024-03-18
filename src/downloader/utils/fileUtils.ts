import * as fs from "fs";

export async function deleteFile(filePath: string) {
    try {
        await fs.promises.unlink(filePath);
        console.log("File deleted successfully:", filePath);
    } catch (error) {
        console.error("Error deleting file:", error.message);
    }
}

export function sanitizeFileName(input: string): string {
    return input.replace(/[^\x20-\x7E]/g, ""); // Remove non-printable ASCII characters
}
