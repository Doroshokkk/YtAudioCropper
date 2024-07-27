import * as fs from "fs";

export async function deleteFile(filePath: string) {
    try {
        await fs.promises.unlink(filePath);
        console.log("File deleted successfully:", filePath);
    } catch (error) {
        console.error("Error deleting file:", error.message);
    }
}

export async function calculateDuration(startSecond, endSecond, videoLength) {
    let duration;

    if (endSecond) {
        if (endSecond <= videoLength) {
            duration = endSecond - startSecond;
        } else {
            duration = videoLength - startSecond;
        }
    } else {
        duration = videoLength - startSecond;
    }

    return duration;
}

export function sanitizeFileName(input: string): string {
    return input.replace(/[^\x20-\x7E]/g, "").replace(/"/g, ""); // Remove non-printable ASCII characters and ""
}

export function sanitizeFileNameForDownload(input: string): string {
    return input.replace(/[^\x20-\x7E]/g, "").replace(/["\\/]/g, ""); // Remove non-printable ASCII characters, quotes, and slashes
}

export function cleanSongName(songName: string, channelName: string): string {
    // Normalize the channel name
    const normalizedChannelName = channelName
        .replace(/VEVO$/i, '')  // Remove 'VEVO' if it appears at the end
        .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space between camelCase words
        .replace(/\s+/g, ' ')  // Normalize spaces
        .trim();

    // Create a dynamic regular expression to match the normalized channel name at the beginning of the song name
    const channelRegex = new RegExp(`^${normalizedChannelName} - `, 'i');

    // Remove the normalized channel name from the song name if it matches
    return songName.replace(channelRegex, '').trim();
}




