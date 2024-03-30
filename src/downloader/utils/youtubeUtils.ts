import * as ytdl from "ytdl-core";

function getVideoInfo(videoUrl: string): Promise<ytdl.videoInfo> {
    const info = ytdl.getBasicInfo(videoUrl);
    console.log("info about video", info);
    return info;
}

export { getVideoInfo };
