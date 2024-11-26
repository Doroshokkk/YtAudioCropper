import * as ytdl from "@distube/ytdl-core";
import * as youtubeUtils from "../utils/youtubeUtils";
import { executeFfmpeg } from "../utils/ffmpegUtils";
import { calculateDuration } from "../utils/fileUtils";

export type AudioCropResponse = { audioStream: any; duration: number; cropped: boolean };

export async function downloadAndCropAudio(videoUrl: string, startSecond?: number, endSecond?: number): Promise<AudioCropResponse> {
    try {
        const info = await youtubeUtils.getVideoInfo(videoUrl);
        const videoLength = Number(info.videoDetails.lengthSeconds);
        const start = startSecond ? startSecond : 0;
        const duration = await calculateDuration(startSecond, endSecond, videoLength);

        const fullLength = start === 0 && (!endSecond || endSecond >= videoLength);

        if (fullLength) {
            // No cropping needed, download directly
            const audioStream = ytdl(videoUrl, { quality: "highestaudio", filter: "audioonly" });

            // const audioStreamWithMeta = executeFfmpeg(audioStream, start, duration);
            return { audioStream: audioStream, duration: videoLength, cropped: false };
        } else {
            // Cropping needed, use FFmpeg
            const audioStream = ytdl(videoUrl, { quality: "highestaudio", filter: "audioonly" });
            const croppedAudioStream = executeFfmpeg(audioStream, start, duration);
            return { audioStream: croppedAudioStream, duration, cropped: true };
        }
    } catch (error) {
        console.error("Error in downloadAndCrop:", error.message);
        throw error;
    }
}
