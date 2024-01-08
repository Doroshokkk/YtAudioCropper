import * as ytdl from "ytdl-core";
import * as ffmpeg from "fluent-ffmpeg";
import * as youtubeModel from "../models/youtubeModel";

function executeFfmpeg(
  videoStream: any,
  outputFilePath: string,
  startSecond: number,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoStream)
      .audioCodec("libmp3lame")
      .audioBitrate(320)
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

async function downloadAndCropAudio(
  videoUrl: string,
  startSecond?: number,
  endSecond?: number
): Promise<string> {
  try {
    console.log("called");
    const info = await youtubeModel.getVideoInfo(videoUrl);
    const videoTitle = info.videoDetails.title;
    const videoLength = info.videoDetails.lengthSeconds;
    const outputFilePath = `${__dirname}/../${videoTitle}_cropped.mp3`;

    const videoStream = ytdl(videoUrl, { quality: "highestaudio" });

    const start = startSecond ? startSecond : 0;
    const end = endSecond
      ? endSecond - startSecond
      : Number(videoLength) - start;

    await executeFfmpeg(videoStream, outputFilePath, start, end);

    return outputFilePath;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

export { downloadAndCropAudio };
