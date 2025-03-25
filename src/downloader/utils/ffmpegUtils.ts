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
        // Complex filter chain using amix for volume changes
        // .audioFilters([
        //     // First apply the overall start/end fades
        //     `afade=t=in:st=0:d=2,afade=t=out:st=${duration - 2}:d=2`,
        //     // Then apply volume changes using amix
        //     `amix=inputs=1:duration=first:dropout_transition=0:weights=1`,
        //     // Apply volume changes for each section
        //     `volume=0.2:enable='between(t,19,30)'`,
        //     `volume=0.2:enable='between(t,70,84)'`,
        //     `volume=1.2:enable='between(t,159,180)'`
        // ].join(','))
        // .audioFilters([
        //     // Initial fade in and out
        //     `afade=t=in:st=0:d=2`,
        //     `afade=t=out:st=${duration - 2}:d=2`,

        //     // Smooth volume fade to 0.2 from t=19 to 30
        //     `volume='if(lt(t,19),1, if(lt(t,30), 1-(t-19)*(0.8/11), 0.2))'`,

        //     // Smooth fade to 0.2 from t=70 to 84
        //     `volume='if(lt(t,70),1, if(lt(t,84), 1-(t-70)*(0.8/14), 0.2))'`,

        //     // Smooth fade to 1.2 from t=159 to 180
        //     `volume='if(lt(t,159),1, if(lt(t,180), 1+(t-159)*(0.2/21), 1.2))'`
        // ])
        .audioFilter("asetpts=PTS-STARTPTS,volume='if(between(t,30,32), 1 - (0.9*(t-30)/2), if(between(t,32,38), 0.1, if(between(t,38,40), 0.1+(0.9*(t-38)/2), 1)))':eval=frame")
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
