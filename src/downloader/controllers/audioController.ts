import * as fs from "fs";
import * as ytdl from "@distube/ytdl-core";
import * as youtubeUtils from "../utils/youtubeUtils";
import * as path from "path";
import { executeFfmpeg } from "../utils/ffmpegUtils";
import { calculateDuration, cleanSongName, sanitizeFileName, sanitizeFileNameForDownload } from "../utils/fileUtils";
import { PassThrough } from "stream";
import axios from "axios";

export type AudioCropResponse = { audioStream: any; duration: number };

export async function downloadAndCropAudio(videoUrl: string, startSecond?: number, endSecond?: number): Promise<AudioCropResponse> {
    try {
        const info = await youtubeUtils.getVideoInfo(videoUrl);
        const videoTitle = info.videoDetails.title;
        const videoLength = Number(info.videoDetails.lengthSeconds);
        const outputFilePath = `${__dirname}/../${sanitizeFileNameForDownload(videoTitle)}_cropped.mp3`;
        const start = startSecond ? startSecond : 0;
        const duration = await calculateDuration(startSecond, endSecond, videoLength);

        const songName = sanitizeFileName(info.videoDetails.title);
        const channelName = sanitizeFileName(info.videoDetails.author.name);
        const cleanedSongName = cleanSongName(songName, channelName);

        if (start === 0 && (!endSecond || endSecond >= videoLength)) {
            // No cropping needed, download directly
            const audioStream = ytdl(videoUrl, { quality: "highestaudio", filter: "audioonly" });

            const audioStreamWithMeta = executeFfmpeg(audioStream, start, duration);
            return { audioStream: audioStreamWithMeta, duration: videoLength };
        } else {
            // Cropping needed, use FFmpeg
            const audioStream = ytdl(videoUrl, { quality: "highestaudio", filter: "audioonly" });
            const croppedAudioStream = executeFfmpeg(audioStream, start, duration);
            return { audioStream: croppedAudioStream, duration };
        }
    } catch (error) {
        console.error("Error in downloadAndCrop:", error.message);
        throw error;
    }
}
