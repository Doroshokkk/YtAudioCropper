import * as ffmpeg from "fluent-ffmpeg";

export function executeFfmpeg(videoStream: any, outputFilePath: string, startSecond: number, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(videoStream)
            .audioCodec("libmp3lame")
            .audioBitrate(192) // Reduced bitrate for smaller file size but good quality
            .audioFrequency(44100) // Ensuring a standard sample rate
            .on("start", (command) => {
                console.log("FFmpeg process started :", command);
            })
            .on("end", () => {
                console.log(`Audio downloaded and cropped:  ${outputFilePath}`);
                resolve();
            })
            .on("error", (error) => {
                console.error("Error:", error.message);
                reject(error);
            })
            .setStartTime(startSecond)
            .setDuration(duration)
            .save(outputFilePath);
    });
}
