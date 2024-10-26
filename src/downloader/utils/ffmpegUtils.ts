import * as ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export function executeFfmpeg(audioStream: any, startSecond: number, duration: number): PassThrough {
    const outputStream = new PassThrough();

    ffmpeg(audioStream)
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .audioFrequency(44100)
        .format("mp3") // Explicitly set output format to mp3
        .setStartTime(startSecond)
        .setDuration(duration)
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
