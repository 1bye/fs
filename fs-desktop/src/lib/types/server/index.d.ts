export interface ServerBaseResponse<T extends object = object> {
    status: number;
    data: T;
    error?: string;
}

export type BaseWebSocketEvent<Event extends string = string, Data extends string | object = object> = {
    event: Event;
    data: Data;
};