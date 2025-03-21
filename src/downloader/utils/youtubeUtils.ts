import { create } from 'yt-dlp-exec';

// Create a custom instance with our system-installed binary
const ytDlp = create('/usr/local/bin/yt-dlp');

export async function getVideoInfo(videoUrl: string) {
    try {
        console.time('call getInfo');
        const result = await ytDlp(videoUrl, {
            skipDownload: true,
            noPlaylist: true,
            quiet: false,
            noWarnings: true,
            // Use specific getters instead of dumpSingleJson
            getTitle: true,      // Only fetch title
            getDuration: true,   // Only fetch duration
            getThumbnail: true,  // Only fetch thumbnail URL
            // Disable unnecessary operations
            writeDescription: false,
            noCheckCertificate: true,
            flatPlaylist: true,
        });
        console.log("result", result);

        console.timeEnd('call getInfo');

        return {
            videoDetails: {
                lengthSeconds: result.duration,
                title: result.title,
                author: {
                    name: result.channel || result.uploader
                },
                thumbnail: {
                    thumbnails: [
                        { url: result.thumbnail }
                    ]
                }
            }
        };
    } catch (error) {
        console.error('Error getting video info:', error);
        throw error;
    }
}
