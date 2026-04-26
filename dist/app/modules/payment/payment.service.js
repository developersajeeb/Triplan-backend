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
exports.PaymentService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const booking_interface_1 = require("../booking/booking.interface");
const booking_model_1 = require("../booking/booking.model");
const sslCommerz_service_1 = require("../sslCommerz/sslCommerz.service");
const payment_interface_1 = require("./payment.interface");
const payment_model_1 = require("./payment.model");
const invoice_1 = require("../../utils/invoice");
const sendEmail_1 = require("../../utils/sendEmail");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const getGatewayUrl = (sslPayment) => {
    var _a, _b, _c, _d, _e;
    return ((sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.GatewayPageURL) ||
        (sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.gatewayPageURL) ||
        (sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.redirectGatewayURL) ||
        (sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.redirect_url) ||
        (sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.paymentUrl) ||
        ((_a = sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.data) === null || _a === void 0 ? void 0 : _a.GatewayPageURL) ||
        ((_b = sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.data) === null || _b === void 0 ? void 0 : _b.gatewayPageURL) ||
        ((_c = sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.data) === null || _c === void 0 ? void 0 : _c.redirectGatewayURL) ||
        ((_d = sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.data) === null || _d === void 0 ? void 0 : _d.redirect_url) ||
        ((_e = sslPayment === null || sslPayment === void 0 ? void 0 : sslPayment.data) === null || _e === void 0 ? void 0 : _e.paymentUrl) ||
        "");
};
const initPayment = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findOne({ booking: bookingId });
    if (!payment) {
        // eslint-disable-next-line no-console
        console.warn("Payment not found for booking:", bookingId);
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Booking payment information not found.");
    }
    if (payment.status === payment_interface_1.PAYMENT_STATUS.PAID) {
        // eslint-disable-next-line no-console
        console.warn("Payment already paid for booking:", bookingId);
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "This booking has already been paid.");
    }
    if (payment.status === payment_interface_1.PAYMENT_STATUS.CANCELLED || payment.status === payment_interface_1.PAYMENT_STATUS.FAILED) {
        // eslint-disable-next-line no-console
        console.warn("Payment in invalid status for init:", { bookingId, status: payment.status });
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "This booking cannot be processed further.");
    }
    const booking = yield booking_model_1.Booking
        .findById(payment.booking)
        .populate("user", "name email phone address");
    if (!booking || !booking.user) {
        // eslint-disable-next-line no-console
        console.error("Booking or user not found:", { bookingId, hasBooking: !!booking, hasUser: !!(booking === null || booking === void 0 ? void 0 : booking.user) });
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Booking or user information is invalid.");
    }
    const userAddress = (booking === null || booking === void 0 ? void 0 : booking.user).address;
    const userEmail = (booking === null || booking === void 0 ? void 0 : booking.user).email;
    const userPhoneNumber = (booking === null || booking === void 0 ? void 0 : booking.user).phone;
    const userName = (booking === null || booking === void 0 ? void 0 : booking.user).name;
    const sslPayload = {
        address: userAddress,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        name: userName,
        amount: payment.amount,
        transactionId: payment.transactionId
    };
    const sslPayment = yield sslCommerz_service_1.SSLService.sslPaymentInit(sslPayload);
    const gatewayUrl = getGatewayUrl(sslPayment);
    if (!gatewayUrl) {
        // eslint-disable-next-line no-console
        console.error("Payment gateway URL not received from SSLCommerz", { sslPayment });
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Payment gateway connection failed. Please try again later.");
    }
    return {
        paymentUrl: gatewayUrl
    };
});
const successPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // Update Booking Status to COnfirm 
    // Update Payment Status to PAID
    const session = yield booking_model_1.Booking.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.PAID,
        }, { new: true, runValidators: true, session: session });
        if (!updatedPayment) {
            // eslint-disable-next-line no-console
            console.error("Payment not found after update:", { transactionId: query.transactionId });
            throw new AppError_1.default(401, "Payment information could not be updated.");
        }
        const updatedBooking = yield booking_model_1.Booking
            .findByIdAndUpdate(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.booking, { status: booking_interface_1.BOOKING_STATUS.COMPLETE }, { new: true, runValidators: true, session })
            .populate("tour", "title")
            .populate("user", "name email");
        if (!updatedBooking) {
            // eslint-disable-next-line no-console
            console.error("Booking not found after update:", { bookingId: updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.booking });
            throw new AppError_1.default(401, "Booking information could not be updated.");
        }
        const invoiceData = {
            bookingDate: updatedBooking.createdAt,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.amount,
            tourTitle: updatedBooking.tour.title,
            transactionId: updatedPayment.transactionId,
            userName: updatedBooking.user.name
        };
        const pdfBuffer = yield (0, invoice_1.generatePdf)(invoiceData);
        const cloudinaryResult = yield (0, cloudinary_config_1.uploadBufferToCloudinary)(pdfBuffer, "invoice", "pdf", "image");
        if (!cloudinaryResult) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload invoice PDF to Cloudinary");
            throw new AppError_1.default(401, "Invoice could not be generated.");
        }
        // Generate signed URL for PDFs to work with restricted media access
        const signedInvoiceUrl = (0, cloudinary_config_1.generateSignedUrl)(cloudinaryResult.public_id, "image");
        yield payment_model_1.Payment.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: signedInvoiceUrl }, { runValidators: true, session });
        yield (0, sendEmail_1.sendEmail)({
            to: updatedBooking.user.email,
            subject: "Your Booking Invoice - triPlan",
            templateName: "invoice",
            templateData: invoiceData,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });
        yield session.commitTransaction(); //transaction
        session.endSession();
        return { success: true, message: "Payment Completed Successfully" };
    }
    catch (error) {
        yield session.abortTransaction(); // rollback
        session.endSession();
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error;
    }
});
const failPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // Update Booking Status to FAIL
    // Update Payment Status to FAIL
    const session = yield booking_model_1.Booking.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.FAILED,
        }, { new: true, runValidators: true, session: session });
        yield booking_model_1.Booking
            .findByIdAndUpdate(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.booking, { status: booking_interface_1.BOOKING_STATUS.FAILED }, { runValidators: true, session });
        yield session.commitTransaction(); //transaction
        session.endSession();
        return { success: false, message: "Payment Failed!" };
    }
    catch (error) {
        yield session.abortTransaction(); // rollback
        session.endSession();
        throw error;
    }
});
const cancelPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // Update Booking Status to CANCEL
    // Update Payment Status to CANCEL
    const session = yield booking_model_1.Booking.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.CANCELLED,
        }, { runValidators: true, session: session });
        yield booking_model_1.Booking
            .findByIdAndUpdate(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.booking, { status: booking_interface_1.BOOKING_STATUS.CANCEL }, { runValidators: true, session });
        yield session.commitTransaction(); //transaction
        session.endSession();
        return { success: false, message: "Payment Cancelled!" };
    }
    catch (error) {
        yield session.abortTransaction(); // rollback
        session.endSession();
        throw error;
    }
});
const getInvoiceDownloadUrl = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findById(paymentId)
        .select("invoiceUrl");
    if (!payment) {
        throw new AppError_1.default(401, "Payment not found");
    }
    if (!payment.invoiceUrl) {
        throw new AppError_1.default(401, "No invoice found");
    }
    return payment.invoiceUrl;
});
exports.PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl
};
