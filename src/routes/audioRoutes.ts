import * as express from "express";
import * as audioController from "../controllers/audioController";
import * as fs from "fs";
import * as youtubeModel from "../models/youtubeModel";

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
    const { filePath, duration } = await audioController.downloadAndCropAudio(
      videoUrl,
      parseInt(startSecond) || null,
      parseInt(endSecond) || null
    );
    const info = await youtubeModel.getVideoInfo(videoUrl);
    const songName = info.videoDetails.title;
    const channelName = info.videoDetails.author;
    res.setHeader("x-song-name", songName);
    res.setHeader("x-channel-name", channelName);
    res.setHeader("x-audio-duration", duration);

    res.download(filePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      } else {
        // Remove the file after sending it
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export = router;
