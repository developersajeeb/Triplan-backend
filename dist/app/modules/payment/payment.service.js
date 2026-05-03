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
const isDateOnlyString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const toLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
const toUTCDateKey = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
const getDateKeys = (value) => {
    const keys = new Set();
    if (typeof value === "string" && isDateOnlyString(value)) {
        keys.add(value);
    }
    const dateValue = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(dateValue.getTime())) {
        keys.add(toLocalDateKey(dateValue));
        keys.add(toUTCDateKey(dateValue));
    }
    return keys;
};
const formatDateKey = (value) => {
    if (!value) {
        return "";
    }
    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
        return "";
    }
    return toLocalDateKey(dateValue);
};
const getMatchingTourBatch = (booking) => {
    var _a, _b, _c;
    const batches = (_b = (_a = booking === null || booking === void 0 ? void 0 : booking.tour) === null || _a === void 0 ? void 0 : _a.batches) !== null && _b !== void 0 ? _b : [];
    if (!batches.length) {
        return null;
    }
    const bookingDateKey = formatDateKey(booking === null || booking === void 0 ? void 0 : booking.date);
    const matchedBatch = batches.find((batch) => formatDateKey(batch === null || batch === void 0 ? void 0 : batch.startDate) === bookingDateKey);
    return (_c = matchedBatch !== null && matchedBatch !== void 0 ? matchedBatch : batches[0]) !== null && _c !== void 0 ? _c : null;
};
const isPaymentInDateRange = (createdAt, startDate, endDate) => {
    if (!startDate && !endDate) {
        return true;
    }
    const paymentDate = new Date(createdAt);
    if (Number.isNaN(paymentDate.getTime())) {
        return false;
    }
    // Single-day filter: compare by date keys to avoid timezone boundary mismatches.
    if (startDate && endDate && startDate === endDate && isDateOnlyString(startDate)) {
        const paymentDateKeys = getDateKeys(paymentDate);
        return paymentDateKeys.has(startDate);
    }
    if (startDate) {
        const startBoundary = isDateOnlyString(startDate)
            ? new Date(`${startDate}T00:00:00`)
            : new Date(startDate);
        if (!Number.isNaN(startBoundary.getTime()) && paymentDate < startBoundary) {
            return false;
        }
    }
    if (endDate) {
        const endBoundary = isDateOnlyString(endDate)
            ? new Date(`${endDate}T23:59:59.999`)
            : new Date(endDate);
        if (!Number.isNaN(endBoundary.getTime()) && paymentDate > endBoundary) {
            return false;
        }
    }
    return true;
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
const getMyPayments = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const bookingMatch = { user: userId };
    const search = typeof query.search === "string" ? query.search.trim() : "";
    const status = typeof query.status === "string" ? query.status.trim() : "";
    const startDate = typeof query.startDate === "string" ? query.startDate.trim() : "";
    const endDate = typeof query.endDate === "string" ? query.endDate.trim() : "";
    const payments = yield payment_model_1.Payment.find()
        .populate({
        path: "booking",
        match: bookingMatch,
        populate: [
            { path: "tour", select: "title slug batches" },
        ],
        select: "tour date guestCount user",
    })
        .sort({ createdAt: -1 });
    const filteredPayments = payments.filter((payment) => {
        var _a;
        const booking = payment.booking;
        if (!(booking === null || booking === void 0 ? void 0 : booking._id))
            return false;
        if (status && payment.status !== status)
            return false;
        if (search) {
            const tourTitle = ((_a = booking === null || booking === void 0 ? void 0 : booking.tour) === null || _a === void 0 ? void 0 : _a.title) || "";
            if (!tourTitle.toLowerCase().includes(search.toLowerCase()))
                return false;
        }
        if (!isPaymentInDateRange(payment.createdAt, startDate, endDate)) {
            return false;
        }
        return true;
    });
    const mappedPayments = filteredPayments.map((payment) => {
        var _a, _b;
        const paymentObj = payment.toObject();
        const booking = paymentObj.booking;
        const matchedBatch = getMatchingTourBatch(booking);
        return Object.assign(Object.assign({}, paymentObj), { booking: Object.assign(Object.assign({}, booking), { batchNo: (_a = matchedBatch === null || matchedBatch === void 0 ? void 0 : matchedBatch.batchNo) !== null && _a !== void 0 ? _a : null }), batchNo: (_b = matchedBatch === null || matchedBatch === void 0 ? void 0 : matchedBatch.batchNo) !== null && _b !== void 0 ? _b : null });
    });
    const total = mappedPayments.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedPayments = mappedPayments.slice(skip, skip + limit);
    return {
        result: paginatedPayments,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    };
});
exports.PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    getMyPayments
};
