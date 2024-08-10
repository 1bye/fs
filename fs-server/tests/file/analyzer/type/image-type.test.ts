import { test } from "bun:test";
import { FileInput } from "@services/file/input";
import serverConfig from "@config/server.config";
import { FileAnalyzerImageType } from "@services/file/analyzer/types/image";

test("Image type", async () => {
    const file = new FileInput({
        pathToFile: `${serverConfig.tmpFolder}/__prepared/image.webp`
    })

    const type = new FileAnalyzerImageType({ file })

    console.log(await type.run());
}, {
    timeout: 50000
})