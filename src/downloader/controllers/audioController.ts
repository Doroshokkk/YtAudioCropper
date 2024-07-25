import * as fs from "fs";
import * as ytdl from "@distube/ytdl-core";
import * as youtubeUtils from "../utils/youtubeUtils";
import { executeFfmpeg } from "../utils/ffmpegUtils";
import { calculateDuration, sanitizeFileNameForDownload } from "../utils/fileUtils";

export type AudioCropResponse = { filePath: string; duration: number };

async function downloadAndCropAudio(videoUrl: string, startSecond?: number, endSecond?: number): Promise<AudioCropResponse> {
    try {
        const info = await youtubeUtils.getVideoInfo(videoUrl);
        const videoTitle = info.videoDetails.title;
        const videoLength = Number(info.videoDetails.lengthSeconds);
        const outputFilePath = `${__dirname}/../${sanitizeFileNameForDownload(videoTitle)}_cropped.mp3`;
        const start = startSecond ? startSecond : 0;
        const duration = await calculateDuration(startSecond, endSecond, videoLength);

        if (start === 0 && (!endSecond || endSecond >= videoLength)) {
            // No cropping needed, download directly
            const videoStream = ytdl(videoUrl, { quality: "highestaudio" });
            const writeStream = fs.createWriteStream(outputFilePath);
            videoStream.pipe(writeStream);

            videoStream.on("error", (error) => {
                console.error("Video stream error:", error);
            });

            const timeout = new Promise(
                (_, reject) => setTimeout(() => reject(new Error("Download timeout")), 30000), // 30s timeout
            );

            await Promise.race([
                new Promise((resolve, reject) => {
                    writeStream.on("finish", resolve);
                    writeStream.on("error", reject);
                }),
                timeout,
            ]);

            return { filePath: outputFilePath, duration: videoLength };
        } else {
            // Cropping needed, use FFmpeg
            const videoStream = ytdl(videoUrl, { quality: "highestaudio" });

            const timeout = new Promise(
                (_, reject) => setTimeout(() => reject(new Error("Download timeout")), 30000), // 30s timeout
            );

            await Promise.race([executeFfmpeg(videoStream, outputFilePath, start, duration), timeout]);

            return { filePath: outputFilePath, duration };
        }
    } catch (error) {
        console.error("Error in downloadAndCrop:", error.message);
        throw error;
    }
}

export { downloadAndCropAudio };
