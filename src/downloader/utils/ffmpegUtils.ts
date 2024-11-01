import * as ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export type tgAudioMetadata = {
    title: string; // Title of the audio track
    performer: string; // Artist or performer of the audio
    thumbnailPath: string; // Path of the thumbnail image to be embedded as album art
};

export function executeFfmpeg(audioStream: any, startSecond: number, duration: number): PassThrough {
    const outputStream = new PassThrough();

    ffmpeg(audioStream)
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .audioFrequency(44100)
        .format("mp3") // Explicitly set output format to mp3
        .setStartTime(startSecond)
        .setDuration(duration)
        // .outputOption("-metadata", `title=${metadata.title}`)
        // .outputOption("-metadata", `artist=${metadata.performer}`)
        // .outputOption("-metadata", `album_artist=${metadata.performer}`)
        // .input(metadata.thumbnailPath) // Add thumbnail as an input
        // .outputOptions([
        //     "-id3v2_version",
        //     "3", // Use ID3v2.3 for compatibility
        //     "-map",
        //     "0:a", // Map the audio stream from the input
        //     "-map",
        //     "1:v", // Map the thumbnail image as album art
        //     "-c:v",
        //     "mjpeg", // Set codec for the image (JPEG is recommended)
        //     "-metadata:s:v",
        //     'title="Album cover"', // Set the title for the cover
        //     "-metadata:s:v",
        //     'comment="Cover (front)"', // Set the comment to specify the image type
        // ])
        .on("start", (command) => {
            console.log("FFmpeg process started:", command);
        })
        .on("error", (error) => {
            console.error("Error during FFMPEG processing:", error.message);
            outputStream.emit("error", error);
        })
        .on("end", () => {
            console.log("Audio processing finished.");
            outputStream.end();
        })
        .pipe(outputStream, { end: true });

    return outputStream;
}
