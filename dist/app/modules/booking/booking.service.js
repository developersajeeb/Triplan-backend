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
exports.BookingService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const tour_model_1 = require("../tour/tour.model");
const user_model_1 = require("../user/user.model");
const booking_interface_1 = require("./booking.interface");
const booking_model_1 = require("./booking.model");
const payment_interface_1 = require("../payment/payment.interface");
const payment_model_1 = require("../payment/payment.model");
const sslCommerz_service_1 = require("../sslCommerz/sslCommerz.service");
const getTransactionId_1 = require("./getTransactionId");
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
const normalizeText = (value) => (value !== null && value !== void 0 ? value : "").trim().toLowerCase();
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
const getBookingStatusLabel = (status) => {
    if (status === booking_interface_1.BOOKING_STATUS.COMPLETE) {
        return "Completed";
    }
    return "Upcoming";
};
const getTourBatchStatusLabel = (status) => getBookingStatusLabel(status);
const getMatchingTourBatch = (booking) => {
    var _a, _b, _c;
    const batches = (_b = (_a = booking.tour) === null || _a === void 0 ? void 0 : _a.batches) !== null && _b !== void 0 ? _b : [];
    if (!batches.length) {
        return null;
    }
    const bookingDateKey = formatDateKey(booking.date);
    const matchedBatch = batches.find((batch) => formatDateKey(batch.startDate) === bookingDateKey);
    return (_c = matchedBatch !== null && matchedBatch !== void 0 ? matchedBatch : batches[0]) !== null && _c !== void 0 ? _c : null;
};
const buildBookingResponse = (booking) => {
    const matchedBatch = getMatchingTourBatch(booking);
    const bookingStatusLabel = getBookingStatusLabel(booking.status);
    return Object.assign(Object.assign({}, booking), { status: booking.status, bookingStatus: bookingStatusLabel, tour: booking.tour, batches: matchedBatch
            ? [
                Object.assign(Object.assign({}, matchedBatch), { batchNo: matchedBatch.batchNo, status: getTourBatchStatusLabel(booking.status), bookingStatus: bookingStatusLabel, payment: booking.payment
                        ? Object.assign(Object.assign({}, booking.payment), { status: booking.payment.status }) : undefined }),
            ]
            : [], payment: booking.payment });
};
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
const createBooking = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const transactionId = (0, getTransactionId_1.getTransactionId)();
    const session = yield booking_model_1.Booking.startSession();
    session.startTransaction();
    try {
        let user = yield user_model_1.User.findById(userId);
        const bookingDate = payload.date ? new Date(payload.date) : undefined;
        if (!bookingDate || Number.isNaN(bookingDate.getTime())) {
            // eslint-disable-next-line no-console
            console.warn("Invalid booking date provided:", payload.date);
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid booking date. Please select a valid date.");
        }
        if (!user) {
            // eslint-disable-next-line no-console
            console.error("User not found:", userId);
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found. Please log in again.");
        }
        const normalizedPhone = (_a = payload.phone) === null || _a === void 0 ? void 0 : _a.trim();
        const normalizedAddress = (_b = payload.address) === null || _b === void 0 ? void 0 : _b.trim();
        const normalizedCountry = (_c = payload.country) === null || _c === void 0 ? void 0 : _c.trim();
        const normalizedCity = (_d = payload.city) === null || _d === void 0 ? void 0 : _d.trim();
        const shouldSyncProfile = (!user.phone && !!normalizedPhone) ||
            (!user.address && !!normalizedAddress) ||
            (!!normalizedCountry && normalizedCountry !== user.country) ||
            (!!normalizedCity && normalizedCity !== user.city);
        if (shouldSyncProfile) {
            const updatedUser = yield user_model_1.User.findByIdAndUpdate(userId, Object.assign(Object.assign(Object.assign(Object.assign({}, (normalizedPhone ? { phone: normalizedPhone } : {})), (normalizedAddress ? { address: normalizedAddress } : {})), (normalizedCountry ? { country: normalizedCountry } : {})), (normalizedCity ? { city: normalizedCity } : {})), { new: true, runValidators: true, session });
            if (updatedUser) {
                user = updatedUser;
            }
        }
        if (!user.phone || !user.address) {
            // eslint-disable-next-line no-console
            console.warn("User missing required fields for booking:", { userId, hasPhone: !!user.phone, hasAddress: !!user.address });
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Phone number and address are required. Please update your profile.");
        }
        const tour = yield tour_model_1.Tour.findById(payload.tour).select("costFrom batches");
        if (!tour) {
            // eslint-disable-next-line no-console
            console.error("Tour not found:", payload.tour);
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Tour not found. Please select another tour.");
        }
        const bookingDateKeys = getDateKeys(bookingDate);
        const selectedBatch = (_e = tour.batches) === null || _e === void 0 ? void 0 : _e.find((batch) => {
            const batchDateKeys = getDateKeys(batch.startDate);
            return [...batchDateKeys].some((key) => bookingDateKeys.has(key));
        });
        if (((_f = tour.batches) === null || _f === void 0 ? void 0 : _f.length) && !selectedBatch) {
            // eslint-disable-next-line no-console
            console.warn("Batch not found for date:", bookingDate);
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Selected tour batch is not available for the chosen date.");
        }
        if (selectedBatch && new Date() > new Date(selectedBatch.regEndDate)) {
            // eslint-disable-next-line no-console
            console.warn("Registration deadline passed for batch:", selectedBatch._id);
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Registration deadline for this batch has passed.");
        }
        const pricePerGuest = selectedBatch
            ? Number(selectedBatch.sellingPrice)
            : Number(tour.costFrom);
        if (!Number.isFinite(pricePerGuest) || pricePerGuest <= 0) {
            // eslint-disable-next-line no-console
            console.error("Invalid price calculated:", { pricePerGuest, batchPrice: selectedBatch === null || selectedBatch === void 0 ? void 0 : selectedBatch.sellingPrice, tourCost: tour.costFrom });
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Tour pricing information is missing. Please try again.");
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const amount = pricePerGuest * Number(payload.guestCount);
        const booking = yield booking_model_1.Booking.create([{
                user: userId,
                status: booking_interface_1.BOOKING_STATUS.PENDING,
                tour: payload.tour,
                guestCount: payload.guestCount,
                date: bookingDate,
            }], { session });
        const payment = yield payment_model_1.Payment.create([{
                booking: booking[0]._id,
                status: payment_interface_1.PAYMENT_STATUS.UNPAID,
                transactionId: transactionId,
                amount: amount
            }], { session });
        const updatedBooking = yield booking_model_1.Booking
            .findByIdAndUpdate(booking[0]._id, { payment: payment[0]._id }, { new: true, runValidators: true, session })
            .populate("user", "name email phone address")
            .populate("tour", "title costFrom batches")
            .populate("payment");
        const userAddress = (updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.user).address;
        const userEmail = (updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.user).email;
        const userPhoneNumber = (updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.user).phone;
        const userName = (updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.user).name;
        const sslPayload = {
            address: userAddress,
            email: userEmail,
            phoneNumber: userPhoneNumber,
            name: userName,
            amount: amount,
            transactionId: transactionId
        };
        const sslPayment = yield sslCommerz_service_1.SSLService.sslPaymentInit(sslPayload);
        const gatewayUrl = getGatewayUrl(sslPayment);
        if (!gatewayUrl) {
            // eslint-disable-next-line no-console
            console.error("Payment gateway URL not received from SSLCommerz", { sslPayment });
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Payment gateway connection failed. Please try again later.");
        }
        yield session.commitTransaction(); //transaction
        session.endSession();
        return {
            paymentUrl: gatewayUrl,
            booking: updatedBooking
        };
    }
    catch (error) {
        yield session.abortTransaction(); // rollback
        session.endSession();
        throw error;
    }
});
// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Complete -> Backend(localhost:5000/api/v1/payment/success) -> Update Payment(PAID) & Booking(COMPLETE) -> redirect to frontend -> Frontend(localhost:5173/payment/success)
// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Fail / Cancel -> Backend(localhost:5000) -> Update Payment(FAIL / CANCEL) & Booking(FAIL / CANCEL) -> redirect to frontend -> Frontend(localhost:5173/payment/cancel or localhost:5173/payment/fail)
const checkAvailability = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { tour, date, guestCount } = payload;
    const tourData = yield tour_model_1.Tour.findById(tour).select("batches regEndDate");
    if (!tourData) {
        // eslint-disable-next-line no-console
        console.warn("Tour not found in checkAvailability:", tour);
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Tour not found. Please select a valid tour.");
    }
    const selectedDate = new Date(date);
    if (Number.isNaN(selectedDate.getTime())) {
        // eslint-disable-next-line no-console
        console.warn("Invalid date format in checkAvailability:", date);
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid date format provided.");
    }
    const selectedDateKeys = getDateKeys(date);
    const selectedBatch = (_a = tourData.batches) === null || _a === void 0 ? void 0 : _a.find((batch) => {
        const batchDateKeys = getDateKeys(batch.startDate);
        return [...batchDateKeys].some((key) => selectedDateKeys.has(key));
    });
    if (((_b = tourData.batches) === null || _b === void 0 ? void 0 : _b.length) && !selectedBatch) {
        return {
            available: false,
            remainingSeats: 0,
            message: "Selected batch is not available for the chosen date.",
        };
    }
    const maxGuest = selectedBatch ? Number(selectedBatch.maxSeat) : NaN;
    if (!Number.isFinite(maxGuest) || maxGuest <= 0) {
        // eslint-disable-next-line no-console
        console.error("Invalid tour seat configuration:", { maxGuest, batchInfo: selectedBatch === null || selectedBatch === void 0 ? void 0 : selectedBatch.maxSeat });
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Tour seat configuration is invalid.");
    }
    const regEndDate = selectedBatch
        ? new Date(selectedBatch.regEndDate)
        : tourData.regEndDate
            ? new Date(tourData.regEndDate)
            : undefined;
    if (!regEndDate) {
        // eslint-disable-next-line no-console
        console.error("Tour registration end date missing for tour:", tour);
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Tour registration information is missing. Please try again.");
    }
    if (new Date() > regEndDate) {
        return {
            available: false,
            remainingSeats: 0,
            message: "Registration deadline for this batch has passed. Please select another batch.",
        };
    }
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const bookings = yield booking_model_1.Booking.aggregate([
        {
            $match: {
                tour: tourData._id,
                date: {
                    $gte: startOfDay,
                    $lt: endOfDay,
                },
                // Reserve seats only for bookings with successful payment.
                status: booking_interface_1.BOOKING_STATUS.COMPLETE,
            },
        },
        {
            $group: {
                _id: null,
                totalBooked: { $sum: "$guestCount" },
            },
        },
    ]);
    const alreadyBooked = ((_c = bookings[0]) === null || _c === void 0 ? void 0 : _c.totalBooked) || 0;
    const remainingSeats = Math.max(0, maxGuest - alreadyBooked);
    if (remainingSeats < guestCount) {
        return {
            available: false,
            remainingSeats,
            message: `Not enough seats available. Only ${remainingSeats} seat(s) left.`,
        };
    }
    return {
        available: true,
        remainingSeats,
        message: "Tour is available for the selected date.",
    };
});
const getUserBookings = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, query = {}) {
    const bookings = yield booking_model_1.Booking.find({ user: userId })
        .populate("tour", "title slug images arrivalLocation startDate endDate batches")
        .populate("payment", "status amount transactionId invoiceUrl")
        .sort({ createdAt: -1 });
    const search = normalizeText(query.search);
    const statusFilter = normalizeText(query.status);
    return bookings
        .map((booking) => buildBookingResponse(booking.toObject()))
        .filter((booking) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const title = normalizeText((_a = booking.tour) === null || _a === void 0 ? void 0 : _a.title);
        const bookingStatus = normalizeText((_b = booking.bookingStatus) !== null && _b !== void 0 ? _b : booking.status);
        const batchStatus = normalizeText((_e = (_d = (_c = booking.batches) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.status) !== null && _e !== void 0 ? _e : (_g = (_f = booking.batches) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.bookingStatus);
        const matchesSearch = search ? title.includes(search) : true;
        const matchesStatus = statusFilter
            ? (statusFilter === "completed"
                ? bookingStatus.includes("complete") || batchStatus.includes("complete")
                : bookingStatus.includes("upcoming") || batchStatus.includes("upcoming"))
            : true;
        return matchesSearch && matchesStatus;
    });
});
const getBookingById = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
const updateBookingStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
const getAllBookings = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
exports.BookingService = {
    createBooking,
    getUserBookings,
    getBookingById,
    updateBookingStatus,
    getAllBookings,
    checkAvailability
};
