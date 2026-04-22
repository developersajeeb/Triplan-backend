import axios from "axios"
import httpStatus from "http-status-codes"
import { envVars } from "../../config/env"
import AppError from "../../errorHelpers/AppError"
import { ISSLCommerz } from "./sslCommerz.interface"

const normalizeSslResponse = (raw: any) => {
    let payload = raw;

    // Some gateways return JSON as string; parse if possible.
    if (typeof raw === "string") {
        try {
            payload = JSON.parse(raw);
        } catch {
            payload = { rawText: raw };
        }
    }

    const gatewayUrl =
        payload?.GatewayPageURL ||
        payload?.gatewayPageURL ||
        payload?.redirectGatewayURL ||
        payload?.redirect_url ||
        payload?.paymentUrl ||
        payload?.data?.GatewayPageURL ||
        payload?.data?.gatewayPageURL ||
        payload?.data?.redirectGatewayURL ||
        payload?.data?.redirect_url ||
        payload?.data?.paymentUrl ||
        "";

    return {
        payload,
        gatewayUrl,
    };
};

const sslPaymentInit = async (payload: ISSLCommerz) => {

    try {
        const data = {
            store_id: envVars.SSL.STORE_ID,
            store_passwd: envVars.SSL.STORE_PASS,
            total_amount: payload.amount,
            currency: "BDT",
            tran_id: payload.transactionId,
            success_url: `${envVars.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
            fail_url: `${envVars.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
            cancel_url: `${envVars.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
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
        }

        const formData = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const response = await axios({
            method: "POST",
            url: envVars.SSL.SSL_PAYMENT_API,
            data: formData.toString(),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })

        const { payload: responseData, gatewayUrl } = normalizeSslResponse(response.data);

        if (!gatewayUrl) {
            const status = responseData?.status || responseData?.data?.status || "UNKNOWN";
            const reason =
                responseData?.failedreason ||
                responseData?.failedReason ||
                responseData?.data?.failedreason ||
                responseData?.data?.failedReason ||
                responseData?.rawText ||
                "No details from gateway";
            console.error("SSLCommerz Gateway Init Failed:", { status, reason, rawResponse: responseData });
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Payment gateway initialization failed. Please try again later.`
            );
        }

        return {
            ...responseData,
            paymentUrl: gatewayUrl,
            GatewayPageURL: gatewayUrl,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }

        const status = error?.response?.data?.status;
        const reason = error?.response?.data?.failedreason || error?.response?.data?.failedReason;
        const details = { status: status || "UNKNOWN", reason: reason || "Network error" };

        console.error("SSLCommerz Request Error:", { ...details, fullError: error?.response?.data || error?.message });
        throw new AppError(httpStatus.BAD_REQUEST, "Payment processing failed. Please try again.")
    }
}

export const SSLService = {
    sslPaymentInit
}