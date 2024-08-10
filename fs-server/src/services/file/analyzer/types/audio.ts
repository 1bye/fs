import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";
import { FileBaseType } from "@services/file/analyzer/types/base";
import { FileInput } from "@services/file/input";
import * as speech from "@google-cloud/speech";
import AudioExtensionTypes from "@etc/json/audio-ext-types.json";

export class FileAnalyzerAudioType extends FileBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;

    fileExtensions: string[] = [".mp3", ".wav", ".flac", ".aac", ".ogg", ...AudioExtensionTypes]; // Add more audio extensions if needed
    fileTypes: string[] = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"]; // Corresponding MIME types

    constructor(config: FileAnalyzerTypeConfig) {
        super(config);
        this.config = config;
    }

    async transcribeAudio(audioPath: string): Promise<string> {
        const client = new speech.v1.SpeechClient();

        const [response] = await client.recognize({
            audio: {
                content: new Uint8Array(await Bun.file(audioPath).arrayBuffer())
            },
            config: {
                languageCode: "en-US", // Set appropriate language code for transcription
                encoding: "LINEAR16",
                // sampleRateHertz: 16000,
            }
        });

        const transcription = response.results
            ?.map(result => result.alternatives?.[0].transcript)
            .join("\n") || "";

        return transcription;
    }

    async run() {
        const file = this.config.file;
        const filePath = file.getPath();

        try {
            const transcription = await this.transcribeAudio(filePath);

            console.log({ transcription });

            return new FileAnalyzerOutput({
                file: new FileInput({
                    pathToFile: file.getFileName(),
                    content: transcription,
                }),
            });
        } catch (error) {
            console.error("Error processing audio file:", error);
            throw error;
        }
    }
}
