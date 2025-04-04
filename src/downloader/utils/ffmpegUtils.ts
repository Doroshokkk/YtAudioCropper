import * as ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export type tgAudioMetadata = {
    title: string; // Title of the audio track
    performer: string; // Artist or performer of the audio
    thumbnailPath: string; // Path of the thumbnail image to be embedded as album art
};

function generateVolumeFilter(volumeAdjustments?: string, startSecond?: number): string {
    if (!volumeAdjustments) return '1';

    const segments = volumeAdjustments.split(',').map(s => s.trim());
    let filterExpression = '1';

    for (let i = segments.length - 1; i >= 0; i--) {
        const segment = segments[i];
        const [timeRange, volume] = segment.split('=').map(s => s.trim());
        const [absoluteStart, absoluteEnd] = timeRange.split('-').map(Number);

        const start = Math.max(0, absoluteStart - startSecond);
        const end = absoluteEnd - startSecond;

        if (end <= 0) continue;

        const volumeDecimal = parseInt(volume) / 100;
        const transitionDuration = 2;

        // Fixed fade-out calculation by using correct reference time (end - transitionDuration)
        const condition = `if(between(t,${start},${start + transitionDuration}), 1 - (${1 - volumeDecimal}*(t-${start})/${transitionDuration}), ` +
            `if(between(t,${start + transitionDuration},${end - transitionDuration}), ${volumeDecimal}, ` +
            `if(between(t,${end - transitionDuration},${end}), ${volumeDecimal} + (${1 - volumeDecimal}*(t-(${end - transitionDuration}))/${transitionDuration}), ${filterExpression})))`;

        filterExpression = condition;
    }

    return filterExpression;
}

export function executeFfmpeg(audioStream: any, startSecond: number, duration: number, volumeAdjustments?: string): PassThrough {
    const outputStream = new PassThrough();

    // volumeAdjustments = "36-48=40%, 90-102=40%, 127-156=120%, 178-200=120%"

    const command = ffmpeg(audioStream)
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .audioFrequency(44100)
        .outputOptions([
            "-write_xing", "1",       // Add XING header for better compatibility
            "-id3v2_version", "3",    // Add ID3v2 tags
            "-metadata", "encoded_by=YtAudioCropper"  // Add metadata
        ])
        .format("mp3")
        .setStartTime(startSecond)
        .setDuration(duration)
        .audioFilters([
            // Initial fade in and out
            `afade=t=in:st=0:d=2`,
            `afade=t=out:st=${duration - 2}:d=2`,

            `volume='${generateVolumeFilter(volumeAdjustments, startSecond)}':eval=frame`
        ])
        .on("start", (command) => {
            console.log("FFmpeg process started:", command);
        })
        .on("error", (error) => {
            console.error("Error during FFMPEG processing:", error.message);
            outputStream.emit('error', error);
        })
        .on("end", () => {
            console.log("Audio processing finished.");
            outputStream.end();
        });

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
