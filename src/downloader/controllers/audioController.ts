import { PassThrough } from 'stream';
import * as youtubeUtils from "../utils/youtubeUtils";
import { executeFfmpeg } from "../utils/ffmpegUtils";
import { calculateDuration } from "../utils/fileUtils";
import { create } from 'yt-dlp-exec';

// Create a custom instance with our system-installed binary
const ytDlp = create('/usr/local/bin/yt-dlp');

export type AudioCropResponse = { audioStream: any; duration: number; cropped: boolean };

export async function downloadAndCropAudio(videoUrl: string, startSecond?: number, endSecond?: number): Promise<AudioCropResponse> {
    try {
        console.time('call getInfo');
        const info = await youtubeUtils.getVideoInfo(videoUrl);
        console.timeEnd('call getInfo');

        const videoLength = Number(info.videoDetails.lengthSeconds);
        const start = startSecond ? startSecond : 0;

        console.log("start", start);
        console.log("videoLength", videoLength);
        if (start >= videoLength) throw new Error("Start time is greater than video length");

        const duration = await calculateDuration(startSecond, endSecond, videoLength);

        const fullLength = start === 0 && (!endSecond || endSecond >= videoLength);
        const passThrough = new PassThrough();

        // Create yt-dlp stream
        const ytDlpProcess = ytDlp.exec(videoUrl, {
            output: '-',  // Output to stdout
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0, // Best quality
            noCheckCertificate: true,
            noWarnings: true,
            preferFreeFormats: true
        });

        if (fullLength) {
            // No cropping needed, pipe directly
            ytDlpProcess.stdout.pipe(passThrough);
            return { audioStream: passThrough, duration: videoLength, cropped: false };
        } else {
            // Cropping needed, use FFmpeg
            const croppedAudioStream = executeFfmpeg(ytDlpProcess.stdout, start, duration);
            return { audioStream: croppedAudioStream, duration, cropped: true };
        }
    } catch (error) {
        console.error("Error in downloadAndCrop:", error.message);
        throw error;
    }
}
