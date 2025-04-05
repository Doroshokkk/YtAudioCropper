import { PassThrough } from 'stream';
import * as youtubeUtils from "../utils/youtubeUtils";
import { executeFfmpeg } from "../utils/ffmpegUtils";
import { calculateDuration } from "../utils/fileUtils";
import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import { once } from 'events'; // for safe async process control

// Create a custom instance with our system-installed binary

export type AudioCropResponse = { audioStream: any; duration: number; cropped: boolean };

export async function downloadAndCropAudio(videoUrl: string, startSecond?: number, endSecond?: number, volumeAdjustments?: string, action?: string): Promise<AudioCropResponse> {
    try {
        console.time('call getInfo');
        const info = await youtubeUtils.getVideoInfo(videoUrl);
        console.timeEnd('call getInfo');

        const videoLength = Number(info.videoDetails.lengthSeconds);
        const start = startSecond ? startSecond : 0;

        console.log("start", start);
        console.log("videoLength", videoLength);
        if (start >= videoLength) throw new Error("Start time is greater than video length");

        const duration = await calculateDuration(startSecond, endSecond, videoLength);

        const fullLength = start === 0 && (!endSecond || endSecond >= videoLength);

        const baseTempFolder = 'temp';
        if (!fs.existsSync(baseTempFolder)) {
            fs.mkdirSync(baseTempFolder, { recursive: true });
        }

        // Generate unique temp folder per download
        const tempFolder = path.join(baseTempFolder, `song_${Date.now()}`);
        fs.mkdirSync(tempFolder, { recursive: true });

        // Define output template
        const outputTemplate = path.join(tempFolder, '%(title)s.%(ext)s');

        // Start yt-dlp process to download audio to temp folder
        const ytDlpProcess = execa('/usr/local/bin/yt-dlp', [
            videoUrl,
            '--output', outputTemplate,
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--no-check-certificate',
            '--no-warnings',
            '--prefer-free-formats',
            '--print-traffic',
        ], { stdout: 'pipe', stderr: 'pipe' });

        console.log(ytDlpProcess.spawnargs.join(' '));

        ytDlpProcess.stderr.on('data', (data) => {
            console.log('yt-dlp debug:', data.toString('utf8'));
        });
        // ytDlpProcess.stdout.on('data', (data) => {
        //     console.log('yt-dlp data:', data.toString('utf8'));
        // });

        // Wait until yt-dlp finishes
        const [exitCode] = await once(ytDlpProcess, 'exit');

        if (exitCode !== 0) {
            throw new Error(`yt-dlp exited with code ${exitCode}`);
        }

        // After yt-dlp finishes, read the downloaded file from temp folder
        const files = fs.readdirSync(tempFolder);
        const audioFile = files.find(file => file.endsWith('.mp3'));
        if (!audioFile) {
            throw new Error('No audio file found in temp folder');
        }

        const audioFilePath = path.join(tempFolder, audioFile);
        const audioFileStream = fs.createReadStream(audioFilePath);

        // Only skip cropping if it's full length AND not an adjust action
        if (fullLength && action !== 'adjust') {
            // Clean up temp files after stream ends
            audioFileStream.on('close', async () => {
                await fs.promises.rm(tempFolder, { recursive: true, force: true });
            });

            return { audioStream: audioFileStream, duration: videoLength, cropped: false };
        } else {
            // Cropping needed, use FFmpeg
            const croppedAudioStream = executeFfmpeg(audioFileStream, start, duration, volumeAdjustments);

            croppedAudioStream.on('close', async () => {
                await fs.promises.rm(tempFolder, { recursive: true, force: true });
            });

            return { audioStream: croppedAudioStream, duration, cropped: true };
        }

        // COMMENTED OUT: direct stdout streaming (problematic with temp files collisions)
        // const ytDlpProcess = ytDlp.exec(videoUrl, {
        //     output: '-',  // Output to stdout
        //     extractAudio: true,
        //     audioFormat: 'mp3',
        //     audioQuality: 0, // Best quality
        //     noCheckCertificate: true,
        //     noWarnings: true,
        //     preferFreeFormats: true,
        // });

        // COMMENTED OUT: direct execa stdout piping
        // const ytDlpProcess = execa('/usr/local/bin/yt-dlp', [
        //     videoUrl,
        //     '--output', '-',
        //     '--extract-audio',
        //     '--audio-format', 'mp3',
        //     '--audio-quality', '0',
        //     '--no-check-certificate',
        //     '--no-warnings',
        //     '--prefer-free-formats',
        //     '--paths', `TEMP:"temp/song_${Date.now()}"`,
        // ], { stdout: 'pipe' });

    } catch (error) {
        console.error("Error in downloadAndCrop:", error.message);
        throw error;
    }
}
