"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlerValidationError = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const handlerValidationError = (err) => {
    const errorSources = [];
    const errors = Object.values(err.errors);
    errors.forEach((errorObject) => errorSources.push({
        path: errorObject.path,
        message: errorObject.message
    }));
    return {
        statusCode: 400,
        message: "Validation Error",
        errorSources
    };
};
exports.handlerValidationError = handlerValidationError;
