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
const review_model_1 = require("../review/review.model");
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
const normalizePaymentStatus = (value) => {
    const normalized = normalizeText(value);
    if (normalized === "paid") {
        return "paid";
    }
    if (normalized === "unpaid" || normalized === "pending") {
        return "unpaid";
    }
    if (normalized === "failed" || normalized === "fail") {
        return "failed";
    }
    if (normalized === "cancel" || normalized === "cancelled") {
        return "cancelled";
    }
    return normalized;
};
const getAdminBookingStatusLabel = (booking) => {
    var _a;
    const baseStatus = normalizeText(String((_a = booking.status) !== null && _a !== void 0 ? _a : ""));
    if (baseStatus.includes("cancel")) {
        return "Cancelled";
    }
    if (baseStatus.includes("fail")) {
        return "Failed";
    }
    if (baseStatus.includes("pending")) {
        return "Pending";
    }
    const timelineStatus = getTimelineStatusLabel(booking);
    if (timelineStatus === "Done") {
        return "Completed";
    }
    return timelineStatus;
};
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const getMonthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const getMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
};
const buildLastSixMonths = () => {
    const months = [];
    const now = new Date();
    for (let index = 5; index >= 0; index -= 1) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
        const key = getMonthKey(date);
        months.push({ key, label: getMonthLabel(key) });
    }
    return months;
};
const getPercentageChange = (current, previous) => {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }
    return Number((((current - previous) / previous) * 100).toFixed(1));
};
const parseDate = (value) => {
    if (!value) {
        return null;
    }
    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
        return null;
    }
    return dateValue;
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
const getTimelineStatusLabel = (booking) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const startDate = parseDate((_e = (_c = (_b = (_a = booking.batches) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.startDate) !== null && _c !== void 0 ? _c : (_d = booking.tour) === null || _d === void 0 ? void 0 : _d.startDate) !== null && _e !== void 0 ? _e : booking.date);
    const endDate = parseDate((_k = (_h = (_g = (_f = booking.batches) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.endDate) !== null && _h !== void 0 ? _h : (_j = booking.tour) === null || _j === void 0 ? void 0 : _j.endDate) !== null && _k !== void 0 ? _k : booking.endDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = startDate
        ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        : null;
    const end = endDate
        ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        : null;
    if (start && today < start) {
        return "Upcoming";
    }
    if (end && today > end) {
        return "Done";
    }
    if (start || end) {
        return "Ongoing";
    }
    return "Upcoming";
};
const getSortableDate = (booking) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return parseDate((_j = (_h = (_f = (_e = (_b = (_a = booking.tour) === null || _a === void 0 ? void 0 : _a.endDate) !== null && _b !== void 0 ? _b : (_d = (_c = booking.batches) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.endDate) !== null && _e !== void 0 ? _e : booking.endDate) !== null && _f !== void 0 ? _f : (_g = booking.tour) === null || _g === void 0 ? void 0 : _g.startDate) !== null && _h !== void 0 ? _h : booking.date) !== null && _j !== void 0 ? _j : booking.createdAt);
};
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
    const timelineStatusLabel = getTimelineStatusLabel(Object.assign(Object.assign({}, booking), { batches: matchedBatch ? [matchedBatch] : booking.batches }));
    return Object.assign(Object.assign({}, booking), { status: booking.status, bookingStatus: timelineStatusLabel, tour: booking.tour, batches: matchedBatch
            ? [
                Object.assign(Object.assign({}, matchedBatch), { batchNo: matchedBatch.batchNo, status: timelineStatusLabel, bookingStatus: timelineStatusLabel, payment: booking.payment
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
        const bookingDateKeys = getDateKeys(String(payload.date));
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
        const bookingDateToPersist = (selectedBatch === null || selectedBatch === void 0 ? void 0 : selectedBatch.startDate)
            ? new Date(selectedBatch.startDate)
            : bookingDate;
        const booking = yield booking_model_1.Booking.create([{
                user: userId,
                status: booking_interface_1.BOOKING_STATUS.PENDING,
                tour: payload.tour,
                guestCount: payload.guestCount,
                date: bookingDateToPersist,
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
    const mapped = bookings
        .map((booking) => {
        const response = buildBookingResponse(booking.toObject());
        const adminStatus = getAdminBookingStatusLabel(response);
        return Object.assign(Object.assign({}, response), { bookingStatus: adminStatus, batches: Array.isArray(response.batches)
                ? response.batches.map((batch) => (Object.assign(Object.assign({}, batch), { status: adminStatus, bookingStatus: adminStatus })))
                : [] });
    })
        .filter((booking) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const title = normalizeText((_a = booking.tour) === null || _a === void 0 ? void 0 : _a.title);
        const bookingStatus = normalizeText((_b = booking.bookingStatus) !== null && _b !== void 0 ? _b : booking.status);
        const batchStatus = normalizeText((_e = (_d = (_c = booking.batches) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.status) !== null && _e !== void 0 ? _e : (_g = (_f = booking.batches) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.bookingStatus);
        const matchesSearch = search ? title.includes(search) : true;
        const matchesStatus = statusFilter
            ? ((statusFilter === "completed" || statusFilter === "done")
                ? bookingStatus.includes("done") || bookingStatus.includes("complete") || batchStatus.includes("done") || batchStatus.includes("complete")
                : statusFilter === "upcoming"
                    ? bookingStatus.includes("upcoming") || batchStatus.includes("upcoming") || bookingStatus.includes("ongoing") || batchStatus.includes("ongoing")
                    : bookingStatus === statusFilter || batchStatus === statusFilter)
            : true;
        return matchesSearch && matchesStatus;
    });
    return mapped.sort((a, b) => {
        const statusA = normalizeText(a.bookingStatus);
        const statusB = normalizeText(b.bookingStatus);
        const isActive = (status) => status.includes("upcoming") || status.includes("ongoing");
        if (statusA !== statusB) {
            if (isActive(statusA) && !isActive(statusB)) {
                return -1;
            }
            if (!isActive(statusA) && isActive(statusB)) {
                return 1;
            }
        }
        const dateA = getSortableDate(a);
        const dateB = getSortableDate(b);
        if (!dateA && !dateB) {
            return 0;
        }
        if (!dateA) {
            return 1;
        }
        if (!dateB) {
            return -1;
        }
        return isActive(statusA)
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
    });
});
const getBookingById = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
const updateBookingStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
const getAllBookings = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const search = normalizeText(query.search);
    const statusFilter = normalizeText(query.status);
    const paymentStatusFilter = normalizeText(query.paymentStatus);
    const sort = normalizeText(query.sort) || "newest";
    const bookings = yield booking_model_1.Booking.find()
        .populate("user", "name fullName firstName lastName email phone")
        .populate("tour", "title slug images arrivalLocation startDate endDate batches")
        .populate("payment", "status amount transactionId invoiceUrl")
        .sort({ createdAt: -1 });
    const mapped = bookings
        .map((booking) => buildBookingResponse(booking.toObject()))
        .filter((booking) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const user = booking.user;
        const customerName = normalizeText((user === null || user === void 0 ? void 0 : user.name) ||
            (user === null || user === void 0 ? void 0 : user.fullName) ||
            `${(_a = user === null || user === void 0 ? void 0 : user.firstName) !== null && _a !== void 0 ? _a : ""} ${(_b = user === null || user === void 0 ? void 0 : user.lastName) !== null && _b !== void 0 ? _b : ""}`.trim() ||
            (user === null || user === void 0 ? void 0 : user.email) ||
            "");
        const tourTitle = normalizeText((_c = booking.tour) === null || _c === void 0 ? void 0 : _c.title);
        const bookingStatus = normalizeText(String((_d = booking.bookingStatus) !== null && _d !== void 0 ? _d : booking.status));
        const paymentStatus = normalizePaymentStatus(String((_k = (_f = (_e = booking.payment) === null || _e === void 0 ? void 0 : _e.status) !== null && _f !== void 0 ? _f : (_j = (_h = (_g = booking.batches) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.payment) === null || _j === void 0 ? void 0 : _j.status) !== null && _k !== void 0 ? _k : ""));
        const matchesSearch = search
            ? customerName.includes(search) || tourTitle.includes(search)
            : true;
        const matchesStatus = (() => {
            if (!statusFilter || statusFilter === "all") {
                return true;
            }
            if (statusFilter === "completed" || statusFilter === "done") {
                return bookingStatus === "completed" || bookingStatus === "done";
            }
            if (statusFilter === "upcoming") {
                return bookingStatus === "upcoming";
            }
            if (statusFilter === "ongoing") {
                return bookingStatus === "ongoing";
            }
            if (statusFilter === "pending") {
                return bookingStatus === "pending";
            }
            if (statusFilter === "cancel" || statusFilter === "cancelled") {
                return bookingStatus === "cancelled" || bookingStatus === "cancel";
            }
            if (statusFilter === "failed") {
                return bookingStatus === "failed" || bookingStatus === "fail";
            }
            return bookingStatus === statusFilter;
        })();
        const matchesPaymentStatus = (() => {
            if (!paymentStatusFilter || paymentStatusFilter === "all") {
                return true;
            }
            const normalizedFilter = normalizePaymentStatus(paymentStatusFilter);
            return paymentStatus === normalizedFilter;
        })();
        return matchesSearch && matchesStatus && matchesPaymentStatus;
    })
        .sort((a, b) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const amountA = Number(((_a = a.payment) === null || _a === void 0 ? void 0 : _a.amount) || ((_d = (_c = (_b = a.batches) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.payment) === null || _d === void 0 ? void 0 : _d.amount) || 0);
        const amountB = Number(((_e = b.payment) === null || _e === void 0 ? void 0 : _e.amount) || ((_h = (_g = (_f = b.batches) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.payment) === null || _h === void 0 ? void 0 : _h.amount) || 0);
        const createdA = new Date((_j = a.createdAt) !== null && _j !== void 0 ? _j : 0).getTime();
        const createdB = new Date((_k = b.createdAt) !== null && _k !== void 0 ? _k : 0).getTime();
        if (sort === "amounthightolow") {
            if (amountA !== amountB) {
                return amountB - amountA;
            }
            return createdB - createdA;
        }
        if (sort === "amountlowtohigh") {
            if (amountA !== amountB) {
                return amountA - amountB;
            }
            return createdB - createdA;
        }
        if (sort === "oldest") {
            return createdA - createdB;
        }
        return createdB - createdA;
    });
    const total = mapped.length;
    const totalPage = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginated = mapped.slice(startIndex, startIndex + limit);
    return {
        data: paginated,
        meta: {
            page,
            limit,
            total,
            totalPage,
            totalPages: totalPage,
            totalListing: total,
        },
    };
});
const getDashboardSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const months = buildLastSixMonths();
    const now = new Date();
    const currentWindowStart = new Date(now);
    currentWindowStart.setDate(currentWindowStart.getDate() - 30);
    const previousWindowStart = new Date(now);
    previousWindowStart.setDate(previousWindowStart.getDate() - 60);
    const [totalBookings, revenueSummary, activeUsersSummary, reviewSummary, revenueTrend, destinationBreakdown, recentBookings, currentWindowUsers, previousWindowUsers, currentWindowRatings, previousWindowRatings] = yield Promise.all([
        booking_model_1.Booking.countDocuments(),
        payment_model_1.Payment.aggregate([
            {
                $match: {
                    status: payment_interface_1.PAYMENT_STATUS.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                },
            },
        ]),
        booking_model_1.Booking.aggregate([
            {
                $group: {
                    _id: "$user",
                },
            },
            {
                $count: "totalActiveUsers",
            },
        ]),
        review_model_1.Review.aggregate([
            {
                $match: {
                    isDeleted: { $ne: true },
                },
            },
            {
                $project: {
                    ratingScore: {
                        $divide: [
                            { $add: ["$guideRating", "$serviceRating", "$transportationRating", "$organizationRating"] },
                            4,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$ratingScore" },
                },
            },
        ]),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    status: booking_interface_1.BOOKING_STATUS.COMPLETE,
                },
            },
            {
                $lookup: {
                    from: "payments",
                    localField: "payment",
                    foreignField: "_id",
                    as: "payment",
                },
            },
            {
                $unwind: "$payment",
            },
            {
                $match: {
                    "payment.status": payment_interface_1.PAYMENT_STATUS.PAID,
                },
            },
            {
                $project: {
                    monthKey: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$createdAt",
                            timezone: "UTC",
                        },
                    },
                    amount: "$payment.amount",
                },
            },
            {
                $group: {
                    _id: "$monthKey",
                    revenue: { $sum: "$amount" },
                    bookings: { $sum: 1 },
                },
            },
            {
                $sort: {
                    _id: 1,
                },
            },
        ]),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    status: booking_interface_1.BOOKING_STATUS.COMPLETE,
                },
            },
            {
                $lookup: {
                    from: "tours",
                    localField: "tour",
                    foreignField: "_id",
                    as: "tour",
                },
            },
            {
                $unwind: "$tour",
            },
            {
                $group: {
                    _id: {
                        $ifNull: [
                            "$tour.arrivalLocation",
                            {
                                $ifNull: ["$tour.divisionName", "$tour.title"],
                            },
                        ],
                    },
                    value: { $sum: 1 },
                },
            },
            {
                $sort: {
                    value: -1,
                },
            },
            {
                $limit: 4,
            },
        ]),
        booking_model_1.Booking.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .populate("user", "name")
            .populate("tour", "title slug arrivalLocation divisionName")
            .populate("payment", "status amount transactionId invoiceUrl")
            .lean(),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: currentWindowStart, $lte: now },
                },
            },
            {
                $group: {
                    _id: "$user",
                },
            },
            {
                $count: "totalUsers",
            },
        ]),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: previousWindowStart, $lt: currentWindowStart },
                },
            },
            {
                $group: {
                    _id: "$user",
                },
            },
            {
                $count: "totalUsers",
            },
        ]),
        review_model_1.Review.aggregate([
            {
                $match: {
                    isDeleted: { $ne: true },
                    createdAt: { $gte: currentWindowStart, $lte: now },
                },
            },
            {
                $project: {
                    ratingScore: {
                        $divide: [
                            { $add: ["$guideRating", "$serviceRating", "$transportationRating", "$organizationRating"] },
                            4,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$ratingScore" },
                },
            },
        ]),
        review_model_1.Review.aggregate([
            {
                $match: {
                    isDeleted: { $ne: true },
                    createdAt: { $gte: previousWindowStart, $lt: currentWindowStart },
                },
            },
            {
                $project: {
                    ratingScore: {
                        $divide: [
                            { $add: ["$guideRating", "$serviceRating", "$transportationRating", "$organizationRating"] },
                            4,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$ratingScore" },
                },
            },
        ]),
    ]);
    const monthTrendMap = new Map(revenueTrend.map((item) => [String(item._id), { revenue: Number(item.revenue) || 0, bookings: Number(item.bookings) || 0 }]));
    const recentTourIds = recentBookings
        .map((booking) => { var _a; return String(booking.tour && typeof booking.tour === "object" ? (_a = booking.tour._id) !== null && _a !== void 0 ? _a : "" : ""); })
        .filter(Boolean);
    const recentReviewSummary = recentTourIds.length > 0
        ? yield review_model_1.Review.aggregate([
            {
                $match: {
                    tour: { $in: recentTourIds },
                    isDeleted: { $ne: true },
                },
            },
            {
                $project: {
                    ratingScore: {
                        $divide: [
                            { $add: ["$guideRating", "$serviceRating", "$transportationRating", "$organizationRating"] },
                            4,
                        ],
                    },
                    tour: 1,
                },
            },
            {
                $group: {
                    _id: "$tour",
                    averageRating: { $avg: "$ratingScore" },
                },
            },
        ])
        : [];
    const reviewMap = new Map(recentReviewSummary.map((item) => [String(item._id), Number(Number(item.averageRating || 0).toFixed(1))]));
    const totalRevenue = Number(((_a = revenueSummary[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0);
    const activeUsers = Number(((_b = activeUsersSummary[0]) === null || _b === void 0 ? void 0 : _b.totalActiveUsers) || 0);
    const averageRating = Number(Number(((_c = reviewSummary[0]) === null || _c === void 0 ? void 0 : _c.averageRating) || 0).toFixed(1));
    const currentUsers = Number(((_d = currentWindowUsers[0]) === null || _d === void 0 ? void 0 : _d.totalUsers) || 0);
    const previousUsers = Number(((_e = previousWindowUsers[0]) === null || _e === void 0 ? void 0 : _e.totalUsers) || 0);
    const currentAverageRating = Number(Number(((_f = currentWindowRatings[0]) === null || _f === void 0 ? void 0 : _f.averageRating) || 0).toFixed(1));
    const previousAverageRating = Number(Number(((_g = previousWindowRatings[0]) === null || _g === void 0 ? void 0 : _g.averageRating) || 0).toFixed(1));
    const revenueTrendValues = months.map((month) => {
        const summary = monthTrendMap.get(month.key) || { revenue: 0, bookings: 0 };
        return summary;
    });
    const latestRevenue = ((_h = revenueTrendValues[revenueTrendValues.length - 1]) === null || _h === void 0 ? void 0 : _h.revenue) || 0;
    const previousRevenue = ((_j = revenueTrendValues[revenueTrendValues.length - 2]) === null || _j === void 0 ? void 0 : _j.revenue) || 0;
    const latestBookings = ((_k = revenueTrendValues[revenueTrendValues.length - 1]) === null || _k === void 0 ? void 0 : _k.bookings) || 0;
    const previousBookings = ((_l = revenueTrendValues[revenueTrendValues.length - 2]) === null || _l === void 0 ? void 0 : _l.bookings) || 0;
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
    const revenueData = months.map((month) => {
        const summary = monthTrendMap.get(month.key) || { revenue: 0, bookings: 0 };
        return {
            month: month.label,
            revenue: summary.revenue,
            bookings: summary.bookings,
        };
    });
    const destinationData = destinationBreakdown.map((item, index) => ({
        name: String(item._id),
        value: Number(item.value) || 0,
        color: colors[index % colors.length],
    }));
    const formattedRecentBookings = recentBookings.map((booking) => {
        var _a;
        const tour = booking.tour || {};
        const payment = booking.payment || {};
        const destination = tour.arrivalLocation || tour.divisionName || tour.title || "N/A";
        const userName = ((_a = booking.user) === null || _a === void 0 ? void 0 : _a.name) || "Guest";
        return {
            id: String(booking._id),
            customer: userName,
            destination,
            amount: Number(payment.amount || 0),
            status: String(booking.status || "PENDING"),
            date: booking.createdAt || booking.date || new Date().toISOString(),
            guestCount: Number(booking.guestCount || 0),
        };
    });
    return {
        stats: {
            totalRevenue,
            totalBookings,
            activeUsers,
            averageRating,
        },
        trend: {
            revenueChange: getPercentageChange(latestRevenue, previousRevenue),
            bookingsChange: getPercentageChange(latestBookings, previousBookings),
            activeUsersChange: getPercentageChange(currentUsers, previousUsers),
            averageRatingChange: getPercentageChange(currentAverageRating, previousAverageRating),
        },
        revenueData,
        destinationData,
        recentBookings: formattedRecentBookings,
    };
});
exports.BookingService = {
    createBooking,
    getUserBookings,
    getBookingById,
    updateBookingStatus,
    getAllBookings,
    getDashboardSummary,
    checkAvailability
};
