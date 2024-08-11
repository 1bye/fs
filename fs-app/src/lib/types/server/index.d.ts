export interface ServerBaseResponse<T extends object = object> {
    status: number;
    data: T;
    error?: string;
}