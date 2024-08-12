import { readWebSocket, type ReadWebSocketOptions } from ".";
import type { BaseWebSocketEvent } from "$lib/types/server";
import { safeParse } from "$lib/utils/json";

export interface IReaderEvent {
    name: string,

    run(data: BaseWebSocketEvent): void
}

export class WSReader {
    events: IReaderEvent[] = [];
    ws: WebSocket;

    constructor(ws: WebSocket, events: IReaderEvent[]) {
        this.ws = ws;
        this.events = events;
    }

    start({ open, close, message }: Pick<ReadWebSocketOptions, "open" | "close" | "message">) {
        return readWebSocket({
            ws: this.ws,
            message: (event) => {
                message?.(event);

                if (!(typeof event.data === "string")) return;

                const data = safeParse<BaseWebSocketEvent>(event?.data || "");

                if (!data) return;

                this.events.find(_ => _.name === data.event)?.run(data)
            },
            open,
            close
        })
    }
}