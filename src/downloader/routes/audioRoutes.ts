import * as express from "express";
import * as audioController from "../controllers/audioController";
import * as youtubeUtils from "../utils/youtubeUtils";
import { cleanSongName, sanitizeFileName } from "../utils/fileUtils";
import { PassThrough } from "stream";

const router = express.Router();

router.get("/crop-audio", async (req, res) => {
    const { videoUrl, startSecond, endSecond } = req.query as {
        videoUrl: string;
        startSecond?: string;
        endSecond?: string;
    };

    if (!videoUrl) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        const { audioStream, duration } = await audioController.downloadAndCropAudio(
            videoUrl,
            parseInt(startSecond) || null,
            parseInt(endSecond) || null,
        );

        const info = await youtubeUtils.getVideoInfo(videoUrl);
        const songName = sanitizeFileName(info.videoDetails.title);
        const channelName = sanitizeFileName(info.videoDetails.author.name);
        const cleanedSongName = cleanSongName(songName, channelName);

        // Set headers before sending the stream
        res.setHeader("x-song-name", cleanedSongName);
        res.setHeader("x-channel-name", channelName);
        res.setHeader("x-audio-duration", duration.toString());
        res.setHeader("x-video-thumbnail", info.videoDetails?.thumbnail?.thumbnails?.[0]?.url);
        res.setHeader("Content-Type", "audio/mpeg");

        audioStream.pipe(res);

        // Handle errors in the audio stream
        audioStream.on("error", (err) => {
            console.error("Error in audio stream:", err);
            res.status(500).end("Internal server error");
        });

        // Handle finish event to clean up
        res.on("finish", () => {
            console.log("Audio stream successfully sent.");
        });
    } catch (error) {
        console.error("Error in crop-audio:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

export = router;
