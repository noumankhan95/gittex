import { CustomError } from "./custom-error";

export class NotFoundError extends CustomError {
    statusCode = 404;
    constructor() {
        super("Route Not Found");
    }

    serializeErrors(): { message: string; field?: string; }[] {
        return [{ message: "Route Not Found" }]
    }
}