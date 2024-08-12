import { writable } from "svelte/store";

export type ReadWebSocketOptions = {
    ws?: WebSocket,
    message?: (ev: MessageEvent) => void,
    close?: (ev: CloseEvent) => void,
    open?: (ev: Event) => void
}

export function readWebSocket({ ws, close, open, message }: ReadWebSocketOptions) {
    const wsEstablished = writable<boolean>(false)
    if (!ws) return { wsEstablished };
    ws.addEventListener("open", ev => {
        wsEstablished.set(true)
        open?.(ev);
    })

    ws.addEventListener("message", ev => {
        message?.(ev);
    })

    ws.addEventListener("close", ev => {
        wsEstablished.set(false)
        close?.(ev);
    })
}

export function getProtocolWS() {
    return window.location.protocol === "https:" ? "wss:" : "ws:";
}