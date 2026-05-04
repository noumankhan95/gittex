import { ValidationError } from "express-validator";
import { CustomError } from "./custom-error";
export class RequestValidationError extends CustomError {
    statusCode = 400;
    constructor(private errors: ValidationError[]) {
        super("Invalid Request Perimeters");
        Object.setPrototypeOf(this, RequestValidationError.prototype)
    }

    public serializeErrors() {
        const formattedErrors: { message: string; field?: string }[] = [];

        for (const err of this.errors) {
            if (err.type === "field") {
                formattedErrors.push({
                    message: err.msg,
                    field: err.path,
                });
            }

            else if (err.type === "alternative") {
                for (const nested of err.nestedErrors) {
                    if (nested.type === "field") {
                        formattedErrors.push({
                            message: nested.msg,
                            field: nested.path,
                        });
                    }
                }
            }

            else if (err.type === "alternative_grouped") {
                formattedErrors.push({
                    message: err.msg,
                });
            }

            else if (err.type === "unknown_fields") {
                formattedErrors.push({
                    message: err.msg,
                });
            }
        }

        return formattedErrors;
    }
}