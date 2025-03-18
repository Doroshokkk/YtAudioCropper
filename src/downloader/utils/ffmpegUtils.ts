import * as ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export type tgAudioMetadata = {
    title: string; // Title of the audio track
    performer: string; // Artist or performer of the audio
    thumbnailPath: string; // Path of the thumbnail image to be embedded as album art
};

export function executeFfmpeg(audioStream: any, startSecond: number, duration: number): PassThrough {
    const outputStream = new PassThrough();

    const command = ffmpeg(audioStream)
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .audioFrequency(44100)
        .format("mp3")
        .setStartTime(startSecond)
        .setDuration(duration)
        .on("start", (command) => {
            console.log("FFmpeg process started:", command);
        })
        .on("error", (error) => {
            console.error("Error during FFMPEG processing:", error.message);
            // Instead of destroying the stream, emit the error
            outputStream.emit('error', error);
        })
        .on("end", () => {
            console.log("Audio processing finished.");
            outputStream.end();
        });

    // Use try-catch around the pipe operation
    try {
        command.pipe(outputStream, { end: true });
    } catch (error) {
        outputStream.emit('error', error);
    }

    return outputStream;
}

// export function executeFfmpeg(audioStream: any, startSecond: number, duration: number): PassThrough {
//     const outputStream = new PassThrough();

//     ffmpeg(audioStream)
//         .audioCodec("libmp3lame")
//         .audioBitrate(192)
//         .audioFrequency(44100)
//         .format("mp3") // Explicitly set output format to mp3
//         .setStartTime(startSecond)
//         .setDuration(duration)
//         // .input(metadata.thumbnailPath) // Adds the thumbnail image file as a second input
//         // .outputOptions([
//         //     '-id3v2_version', '3', // Set ID3 tag version
//         //     // '-map', '0:a', // Use the audio stream from the first input (index 0)
//         //     // '-map', '1:v', // Use the video (image) stream from the second input (index 1)
//         //     // '-c:v', 'mjpeg', // Set the codec for the image (MJPEG is recommended for album art) //this stuff doesn't work, but lower 3 work
//         //     // '-metadata:s:v', 'title="Album cover"', // Set the title for the album art
//         //     // '-metadata:s:v', 'comment="Cover (front)"', // Set the type of cover art
//         // ])
//         // .outputOption('-metadata', `title=${metadata.title}`)
//         // .outputOption('-metadata', `artist=${metadata.performer}`)
//         // .outputOption('-metadata', `album_artist=${metadata.performer}`)
//         .on("start", (command) => {
//             console.log("FFmpeg process started:", command);
//         })
//         .on("error", (error) => {
//             console.error("Error during FFMPEG processing:", error.message);
//             outputStream.destroy(error); // Destroy the stream to propagate the error
//         })
//         .on("end", () => {
//             console.log("Audio processing finished.");
//             outputStream.end();
//         })
//         .pipe(outputStream, { end: true });

//     return outputStream;
// }
