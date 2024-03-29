import * as ytdl from "ytdl-core";
import * as youtubeUtils from "../utils/youtubeUtils";
import { executeFfmpeg } from "../utils/ffmpegUtils";
import { calculateDuration } from "../utils/fileUtils";

export type AudioCropResponse = { filePath: string; duration: number };

async function downloadAndCropAudio(videoUrl: string, startSecond?: number, endSecond?: number): Promise<AudioCropResponse> {
    try {
        const info = await youtubeUtils.getVideoInfo(videoUrl);
        const videoTitle = info.videoDetails.title;
        const videoLength = Number(info.videoDetails.lengthSeconds);
        const outputFilePath = `${__dirname}/../${videoTitle}_cropped.mp3`;
        const videoStream = ytdl(videoUrl, { quality: "highestaudio" });
        const start = startSecond ? startSecond : 0;
        const duration = await calculateDuration(startSecond, endSecond, videoLength);

        await executeFfmpeg(videoStream, outputFilePath, start, duration);
        return { filePath: outputFilePath, duration };
    } catch (error) {
        console.error("Error:", error.message);
        throw error;
    }
}

export { downloadAndCropAudio };
