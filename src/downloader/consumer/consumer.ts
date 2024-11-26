import * as amqp from "amqplib";
import * as audioController from "../controllers/audioController";
import * as youtubeUtils from "../utils/youtubeUtils";
import { calculateDuration, cleanSongName, sanitizeFileName } from "../utils/fileUtils";
import { PassThrough } from "stream";
import axios from "axios";
import { Telegraf } from "telegraf";
require("dotenv").config();
const { TOKEN, SERVER_URL, RABBITMQ_IP } = process.env;

const RABBITMQ_URL = process.env.RABBITMQ_URL || `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_IP}:5672`;
const QUEUE_NAME = "audio_queue";

const URI = `/webhook/audio-processed`;
const RESPONSE_WEBHOOK_URL = SERVER_URL + URI;

export async function startConsumer() {
    const bot = new Telegraf(TOKEN);

    try {
        console.log("starting to consume");
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAME, {
            durable: true,
        });

        channel.consume(
            QUEUE_NAME,
            async (message) => {
                if (message) {
                    const { chatId, videoUrl, startSecond, endSecond } = JSON.parse(message.content.toString());
                    console.log(`Received message with chatId: ${chatId} and videoUrl: ${videoUrl}`);

                    try {
                        console.log("RESPONSE_WEBHOOK_URL", RESPONSE_WEBHOOK_URL);
                        const info = await youtubeUtils.getVideoInfo(videoUrl);
                        const videoLength = Number(info.videoDetails.lengthSeconds);

                        const audioDuration = await calculateDuration(parseInt(startSecond) || 0, parseInt(endSecond) || null, videoLength);
                        console.log("audioDuration", audioDuration);
                        if (audioDuration > 600) {
                            console.log("before send message");
                            await bot.telegram.sendMessage(
                                chatId,
                                `Sorry, couldn't download audio for ${info.videoDetails.title}. It's longer than 10 minutes, I am still young and don't have enough processing power for such requests =(`,
                            );
                            console.log("after send message");
                            channel.ack(message);
                            return;
                        }

                        console.log("after audioduration check");
                        // throw new Error("testing");
                        channel.ack(message);
                        await processMessage(chatId, videoUrl, info, startSecond, endSecond); //should only wait until we send the message, other isn't important. Can ack in this case
                    } catch (error) {
                        console.error("Failed to process message:", error);
                        channel.nack(message);
                    }
                }
            },
            { noAck: false },
        );

        console.log(`Waiting for messages in ${QUEUE_NAME}...`);
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
    }
}

async function processMessage(chatId: number, videoUrl: string, info, startSecond?: string, endSecond?: string) {
    try {
        const bot = new Telegraf(TOKEN);

        const songName = sanitizeFileName(info.videoDetails.title);
        const channelName = sanitizeFileName(info.videoDetails.author.name);
        const cleanedSongName = cleanSongName(songName, channelName);

        console.log("before downloadAndCropAudio");

        const { audioStream, duration, cropped } = await audioController.downloadAndCropAudio(
            videoUrl,
            parseInt(startSecond) || null,
            parseInt(endSecond) || null,
        );

        console.log("after downloadAndCropAudio");

        const passThrough = new PassThrough();
        audioStream.pipe(passThrough);

        audioStream.on("error", (err) => {
            console.error("Error in audio stream:", err);
            throw new Error("Error in audio stream");
        });

        let response;

        response = await bot.telegram.sendAudio(
            chatId,
            {
                source: passThrough,
            },
            {
                title: cleanedSongName,
                duration: duration,
                performer: channelName,
                thumbnail: { url: info.videoDetails?.thumbnail?.thumbnails?.[0]?.url },
                caption: "@ytAudioCropBot",
            },
        );
        // }

        await sendToWebhook(chatId, videoUrl, cleanedSongName, duration, cropped, channelName, response?.audio?.file_id).catch((error) => {
            console.log("failed to send to webhook", error.message);
        });

        console.log("response", response?.audio?.title);

        return response;

        // const params = {
        //     Bucket: "yt.crop.test",
        //     Key: `${cleanedSongName}.mp3`,
        //     Body: passThrough,
        //     ContentType: "audio/mpeg",
        //     ACL: "public-read",
        // };

        // s3.upload(params, async (err, data) => {
        //     if (err) {
        //         console.error("Error uploading to S3:", err);
        //         throw new Error("Failed to upload to S3");
        //     }

        //     console.log("Successfully uploaded to S3:", data.Location);
        //     await sendToWebhook(chatId, info.videoDetails?.thumbnail?.thumbnails?.[0]?.url, cleanedSongName, channelName, duration, data.Location);
        // });
    } catch (error) {
        console.error("Error processing message:", error.message);
        throw error;
    }
}

async function sendToWebhook(
    chatId: number,
    youtube_url: string,
    audio_name: string,
    duration: number,
    isCropped: boolean,
    channel_name?: string,
    file_id?: string,
) {
    try {
        const response = await axios.post(RESPONSE_WEBHOOK_URL, {
            chatId,
            youtube_url,
            audio_name,
            duration,
            isCropped,
            channel_name,
            file_id,
        });

        console.log("Successfully sent data to webhook:", response.status);
    } catch (error) {
        console.error("Failed to send data to webhook:", error.message);
        throw error;
    }
}
