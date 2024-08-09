import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import * as fs from "node:fs/promises";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";
import { FileBaseType } from "@services/file/analyzer/types/base";
import { FileInput } from "@services/file/input";
import * as speech from "@google-cloud/speech";
import path from "node:path";
import ffmpeg from "@etc/ffmpeg";
import serverConfig from "@config/server.config";
import VideoExtensionTypes from "@etc/json/video-ext-types.json";

export class FileAnalyzerVideoType extends FileBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;

    fileExtensions: string[] = [".mp4", ".avi", ".mov", ".mkv", ...VideoExtensionTypes]; // Add more video extensions if needed
    fileTypes: string[] = ["video/mp4", "video/x-matroska", "video/quicktime", "video/x-msvideo"]; // Corresponding MIME types

    constructor(config: FileAnalyzerTypeConfig) {
        super(config);
        this.config = config;
    }

    async extractAudio(filePath: string): Promise<string> {
        const tempAudioPath = path.join(serverConfig.tmpFolder, `${Date.now()}_audio.wav`);

        return new Promise<string>((resolve, reject) => {
            ffmpeg(filePath)
                .output(tempAudioPath)
                .audioCodec("pcm_s16le") // This ensures the audio is in a format suitable for Google Speech-to-Text
                .duration(30) // Limit audio extraction to the first 30 seconds
                .on("end", () => resolve(tempAudioPath))
                .on("error", (err) => reject(err))
                .run();
        });
    }

    async transcribeAudio(audioPath: string): Promise<string> {
        const client = new speech.v2.SpeechClient();

        const audioBytes = await fs.readFile(audioPath);

        const [response] = await client.recognize({
            content: new Uint8Array(audioBytes),
            config: {
                model: "short",
                explicitDecodingConfig: {
                    encoding: "LINEAR16",
                    sampleRateHertz: 16000
                }
            }
        });
        console.log(response.results)
        const transcription = response.results
            ?.map(result => result.alternatives?.[0].transcript)
            .join("\n") || "";

        return transcription;
    }

    async run() {
        const file = this.config.file;
        const filePath = file.getPath();

        try {
            const audioPath = await this.extractAudio(filePath);
            const [transcription] = await Promise.all([
                this.transcribeAudio(audioPath),
                fs.unlink(audioPath)
            ]);

            return new FileAnalyzerOutput({
                file: new FileInput({
                    pathToFile: file.getFileName(),
                    content: transcription,
                }),
            });
        } catch (error) {
            console.error("Error processing video file:", error);
            throw error;
        }
    }
}
