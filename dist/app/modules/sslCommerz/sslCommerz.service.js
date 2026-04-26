"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSLService = void 0;
const axios_1 = __importDefault(require("axios"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const env_1 = require("../../config/env");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const normalizeSslResponse = (raw) => {
    var _a, _b, _c, _d, _e;
    let payload = raw;
    // Some gateways return JSON as string; parse if possible.
    if (typeof raw === "string") {
        try {
            payload = JSON.parse(raw);
        }
        catch (_f) {
            payload = { rawText: raw };
        }
    }
    const gatewayUrl = (payload === null || payload === void 0 ? void 0 : payload.GatewayPageURL) ||
        (payload === null || payload === void 0 ? void 0 : payload.gatewayPageURL) ||
        (payload === null || payload === void 0 ? void 0 : payload.redirectGatewayURL) ||
        (payload === null || payload === void 0 ? void 0 : payload.redirect_url) ||
        (payload === null || payload === void 0 ? void 0 : payload.paymentUrl) ||
        ((_a = payload === null || payload === void 0 ? void 0 : payload.data) === null || _a === void 0 ? void 0 : _a.GatewayPageURL) ||
        ((_b = payload === null || payload === void 0 ? void 0 : payload.data) === null || _b === void 0 ? void 0 : _b.gatewayPageURL) ||
        ((_c = payload === null || payload === void 0 ? void 0 : payload.data) === null || _c === void 0 ? void 0 : _c.redirectGatewayURL) ||
        ((_d = payload === null || payload === void 0 ? void 0 : payload.data) === null || _d === void 0 ? void 0 : _d.redirect_url) ||
        ((_e = payload === null || payload === void 0 ? void 0 : payload.data) === null || _e === void 0 ? void 0 : _e.paymentUrl) ||
        "";
    return {
        payload,
        gatewayUrl,
    };
};
const sslPaymentInit = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const data = {
            store_id: env_1.envVars.SSL.STORE_ID,
            store_passwd: env_1.envVars.SSL.STORE_PASS,
            total_amount: payload.amount,
            currency: "BDT",
            tran_id: payload.transactionId,
            success_url: `${env_1.envVars.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
            fail_url: `${env_1.envVars.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
            cancel_url: `${env_1.envVars.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
            // ipn_url: "http://localhost:3030/ipn",
            shipping_method: "N/A",
            product_name: "Tour",
            product_category: "Service",
            product_profile: "general",
            cus_name: payload.name,
            cus_email: payload.email,
            cus_add1: payload.address,
            cus_add2: "N/A",
            cus_city: "Dhaka",
            cus_state: "Dhaka",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: payload.phoneNumber,
            cus_fax: "01711111111",
            ship_name: "N/A",
            ship_add1: "N/A",
            ship_add2: "N/A",
            ship_city: "N/A",
            ship_state: "N/A",
            ship_postcode: 1000,
            ship_country: "N/A",
        };
        const formData = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
        const response = yield (0, axios_1.default)({
            method: "POST",
            url: env_1.envVars.SSL.SSL_PAYMENT_API,
            data: formData.toString(),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        const { payload: responseData, gatewayUrl } = normalizeSslResponse(response.data);
        if (!gatewayUrl) {
            const status = (responseData === null || responseData === void 0 ? void 0 : responseData.status) || ((_a = responseData === null || responseData === void 0 ? void 0 : responseData.data) === null || _a === void 0 ? void 0 : _a.status) || "UNKNOWN";
            const reason = (responseData === null || responseData === void 0 ? void 0 : responseData.failedreason) ||
                (responseData === null || responseData === void 0 ? void 0 : responseData.failedReason) ||
                ((_b = responseData === null || responseData === void 0 ? void 0 : responseData.data) === null || _b === void 0 ? void 0 : _b.failedreason) ||
                ((_c = responseData === null || responseData === void 0 ? void 0 : responseData.data) === null || _c === void 0 ? void 0 : _c.failedReason) ||
                (responseData === null || responseData === void 0 ? void 0 : responseData.rawText) ||
                "No details from gateway";
            console.error("SSLCommerz Gateway Init Failed:", { status, reason, rawResponse: responseData });
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Payment gateway initialization failed. Please try again later.`);
        }
        return Object.assign(Object.assign({}, responseData), { paymentUrl: gatewayUrl, GatewayPageURL: gatewayUrl });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        const status = (_e = (_d = error === null || error === void 0 ? void 0 : error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.status;
        const reason = ((_g = (_f = error === null || error === void 0 ? void 0 : error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.failedreason) || ((_j = (_h = error === null || error === void 0 ? void 0 : error.response) === null || _h === void 0 ? void 0 : _h.data) === null || _j === void 0 ? void 0 : _j.failedReason);
        const details = { status: status || "UNKNOWN", reason: reason || "Network error" };
        console.error("SSLCommerz Request Error:", Object.assign(Object.assign({}, details), { fullError: ((_k = error === null || error === void 0 ? void 0 : error.response) === null || _k === void 0 ? void 0 : _k.data) || (error === null || error === void 0 ? void 0 : error.message) }));
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Payment processing failed. Please try again.");
    }
});
exports.SSLService = {
    sslPaymentInit
};
