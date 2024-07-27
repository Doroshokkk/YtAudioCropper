import * as express from "express";
import * as audioController from "../controllers/audioController";
import * as youtubeUtils from "../utils/youtubeUtils";
import { cleanSongName, deleteFile, sanitizeFileName } from "../utils/fileUtils";

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

    let filePathToDelete: string;

    try {
        const { filePath, duration } = await audioController.downloadAndCropAudio(
            videoUrl,
            parseInt(startSecond) || null,
            parseInt(endSecond) || null,
        );
        filePathToDelete = filePath;
        const info = await youtubeUtils.getVideoInfo(videoUrl);
        const songName = sanitizeFileName(info.videoDetails.title);
        const channelName = sanitizeFileName(info.videoDetails.author.name);
        const cleanedSongName = cleanSongName(songName, channelName);
        console.log("clean song name: ", cleanedSongName);
        console.log("channelName", channelName);

        res.setHeader("x-song-name", cleanedSongName);
        res.setHeader("x-channel-name", channelName);
        res.setHeader("x-audio-duration", duration);
        res.setHeader("x-video-thumbnail", info.videoDetails?.thumbnail?.thumbnails?.[0]?.url);
        res.download(filePath, async (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }
            await deleteFile(filePath);
        });
    } catch (error) {
        console.error("Error in crop-audio:", error.message);
        res.status(500).json({ error: "Internal server error" });
        await deleteFile(filePathToDelete);
    }
});

export = router;
