import * as fs from "fs";
import * as ytdl from "@distube/ytdl-core";
import * as youtubeUtils from "../utils/youtubeUtils";
import { executeFfmpeg } from "../utils/ffmpegUtils";
import { calculateDuration, sanitizeFileNameForDownload } from "../utils/fileUtils";
import { PassThrough } from "stream";

export type AudioCropResponse = { audioStream: any; duration: number };

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
            const audioStream = ytdl(videoUrl, { quality: "highestaudio" });
            return { audioStream, duration: videoLength };
        } else {
            // Cropping needed, use FFmpeg
            const audioStream = ytdl(videoUrl, { quality: "highestaudio" });
            // const timeout = new Promise(
            //     (_, reject) => setTimeout(() => reject(new Error("Download timeout")), 30000), // 30s timeout
            // );
            // await Promise.race([executeFfmpeg(videoStream, outputFilePath, start, duration), timeout]);
            const croppedAudioStream = executeFfmpeg(audioStream, start, duration);
            return { audioStream: croppedAudioStream, duration };
        }
    } catch (error) {
        console.error("Error in downloadAndCrop:", error.message);
        throw error;
    }
}

export { downloadAndCropAudio };
