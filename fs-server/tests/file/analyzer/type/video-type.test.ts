import { test } from "bun:test";
import { FileAnalyzerVideoType } from "@services/file/analyzer/types/video";
import { FileInput } from "@services/file/input";
import serverConfig from "@config/server.config";

test("Video type", async () => {
    const file = new FileInput({
        pathToFile: `${serverConfig.tmpFolder}/__prepared/video.mp4`
    })

    const type = new FileAnalyzerVideoType({ file })

    console.log(await type.run());
}, {
    timeout: 500000
})