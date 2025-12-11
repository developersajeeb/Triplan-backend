import { TGenericErrorResponse } from "../interfaces/error.types"

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handlerDuplicateError = (err: any): TGenericErrorResponse => {
    const matchedArray = err.message?.match(/"([^"]*)"/);
    const value = matchedArray?.[1] || "Field";

    return {
        statusCode: 400,
        message: `${value} already exists!`
    };
};