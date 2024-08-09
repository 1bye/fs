import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

ffmpegPath && ffmpeg.setFfmpegPath(ffmpegPath);

export default ffmpeg;