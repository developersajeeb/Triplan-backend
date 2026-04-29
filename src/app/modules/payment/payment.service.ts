/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { ITour } from "../tour/tour.interface";
import { IUser } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";
import { uploadBufferToCloudinary, generateSignedUrl } from "../../config/cloudinary.config";

const getGatewayUrl = (sslPayment: any) => {
    return (
        sslPayment?.GatewayPageURL ||
        sslPayment?.gatewayPageURL ||
        sslPayment?.redirectGatewayURL ||
        sslPayment?.redirect_url ||
        sslPayment?.paymentUrl ||
        sslPayment?.data?.GatewayPageURL ||
        sslPayment?.data?.gatewayPageURL ||
        sslPayment?.data?.redirectGatewayURL ||
        sslPayment?.data?.redirect_url ||
        sslPayment?.data?.paymentUrl ||
        ""
    );
};

const isDateOnlyString = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const toLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const toUTCDateKey = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getDateKeys = (value: string | Date) => {
    const keys = new Set<string>();

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

const formatDateKey = (value?: string | Date) => {
    if (!value) {
        return "";
    }

    const dateValue = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(dateValue.getTime())) {
        return "";
    }

    return toLocalDateKey(dateValue);
};

const getMatchingTourBatch = (booking: any) => {
    const batches = booking?.tour?.batches ?? [];

    if (!batches.length) {
        return null;
    }

    const bookingDateKey = formatDateKey(booking?.date);
    const matchedBatch = batches.find((batch: any) => formatDateKey(batch?.startDate) === bookingDateKey);

    return matchedBatch ?? batches[0] ?? null;
};

const isPaymentInDateRange = (createdAt: Date, startDate: string, endDate: string) => {
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

const initPayment = async (bookingId: string) => {

    const payment = await Payment.findOne({ booking: bookingId })

    if (!payment) {
        // eslint-disable-next-line no-console
        console.warn("Payment not found for booking:", bookingId);
        throw new AppError(httpStatus.NOT_FOUND, "Booking payment information not found.")
    }

    if (payment.status === PAYMENT_STATUS.PAID) {
        // eslint-disable-next-line no-console
        console.warn("Payment already paid for booking:", bookingId);
        throw new AppError(httpStatus.BAD_REQUEST, "This booking has already been paid.")
    }

    if (payment.status === PAYMENT_STATUS.CANCELLED || payment.status === PAYMENT_STATUS.FAILED) {
        // eslint-disable-next-line no-console
        console.warn("Payment in invalid status for init:", { bookingId, status: payment.status });
        throw new AppError(httpStatus.BAD_REQUEST, "This booking cannot be processed further.")
    }

    const booking = await Booking
        .findById(payment.booking)
        .populate("user", "name email phone address")

    if (!booking || !booking.user) {
        // eslint-disable-next-line no-console
        console.error("Booking or user not found:", { bookingId, hasBooking: !!booking, hasUser: !!booking?.user });
        throw new AppError(httpStatus.BAD_REQUEST, "Booking or user information is invalid.");
    }

    const userAddress = (booking?.user as any).address
    const userEmail = (booking?.user as any).email
    const userPhoneNumber = (booking?.user as any).phone
    const userName = (booking?.user as any).name

    const sslPayload: ISSLCommerz = {
        address: userAddress,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        name: userName,
        amount: payment.amount,
        transactionId: payment.transactionId
    }

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);
    const gatewayUrl = getGatewayUrl(sslPayment);

    if (!gatewayUrl) {
        // eslint-disable-next-line no-console
        console.error("Payment gateway URL not received from SSLCommerz", { sslPayment });
        throw new AppError(httpStatus.BAD_REQUEST, "Payment gateway connection failed. Please try again later.")
    }

    return {
        paymentUrl: gatewayUrl
    }
};

const successPayment = async (query: Record<string, string>) => {

    // Update Booking Status to COnfirm 
    // Update Payment Status to PAID

    const session = await Booking.startSession();
    session.startTransaction()

    try {
        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.PAID,
        }, { new: true, runValidators: true, session: session })

        if (!updatedPayment) {
            // eslint-disable-next-line no-console
            console.error("Payment not found after update:", { transactionId: query.transactionId });
            throw new AppError(401, "Payment information could not be updated.")
        }

        const updatedBooking = await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.COMPLETE },
                { new: true, runValidators: true, session }
            )
            .populate("tour", "title")
            .populate("user", "name email")

        if (!updatedBooking) {
            // eslint-disable-next-line no-console
            console.error("Booking not found after update:", { bookingId: updatedPayment?.booking });
            throw new AppError(401, "Booking information could not be updated.")
        }

        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.amount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title,
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name
        }

        const pdfBuffer = await generatePdf(invoiceData)
        const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice", "pdf", "image")

        if (!cloudinaryResult) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload invoice PDF to Cloudinary");
            throw new AppError(401, "Invoice could not be generated.")
        }

        // Generate signed URL for PDFs to work with restricted media access
        const signedInvoiceUrl = generateSignedUrl(cloudinaryResult.public_id, "image")

        await Payment.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: signedInvoiceUrl }, { runValidators: true, session })

        await sendEmail({
            to: (updatedBooking.user as unknown as IUser).email,
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
        })

        await session.commitTransaction(); //transaction
        session.endSession()
        return { success: true, message: "Payment Completed Successfully" }
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error
    }
};

const failPayment = async (query: Record<string, string>) => {

    // Update Booking Status to FAIL
    // Update Payment Status to FAIL

    const session = await Booking.startSession();
    session.startTransaction()

    try {
        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.FAILED,
        }, { new: true, runValidators: true, session: session })

        await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.FAILED },
                { runValidators: true, session }
            )

        await session.commitTransaction(); //transaction
        session.endSession()
        return { success: false, message: "Payment Failed!" }
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        throw error
    }
};

const cancelPayment = async (query: Record<string, string>) => {

    // Update Booking Status to CANCEL
    // Update Payment Status to CANCEL

    const session = await Booking.startSession();
    session.startTransaction()

    try {


        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.CANCELLED,
        }, { runValidators: true, session: session })

        await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.CANCEL },
                { runValidators: true, session }
            )

        await session.commitTransaction(); //transaction
        session.endSession()
        return { success: false, message: "Payment Cancelled!" }
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        throw error
    }
};

const getInvoiceDownloadUrl = async (paymentId: string) => {
    const payment = await Payment.findById(paymentId)
        .select("invoiceUrl")

    if (!payment) {
        throw new AppError(401, "Payment not found")
    }

    if (!payment.invoiceUrl) {
        throw new AppError(401, "No invoice found")
    }

    return payment.invoiceUrl
};

const getMyPayments = async (userId: string, query: Record<string, any>) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const bookingMatch: Record<string, any> = { user: userId };

    const search = typeof query.search === "string" ? query.search.trim() : "";
    const status = typeof query.status === "string" ? query.status.trim() : "";
    const startDate = typeof query.startDate === "string" ? query.startDate.trim() : "";
    const endDate = typeof query.endDate === "string" ? query.endDate.trim() : "";

    const payments = await Payment.find()
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
        const booking = payment.booking as any;
        if (!booking?._id) return false;

        if (status && payment.status !== status) return false;

        if (search) {
            const tourTitle = booking?.tour?.title || "";
            if (!tourTitle.toLowerCase().includes(search.toLowerCase())) return false;
        }

        if (!isPaymentInDateRange((payment as any).createdAt as Date, startDate, endDate)) {
            return false;
        }

        return true;
    });

    const mappedPayments = filteredPayments.map((payment) => {
        const paymentObj = payment.toObject() as any;
        const booking = paymentObj.booking;
        const matchedBatch = getMatchingTourBatch(booking);

        return {
            ...paymentObj,
            booking: {
                ...booking,
                batchNo: matchedBatch?.batchNo ?? null,
            },
            batchNo: matchedBatch?.batchNo ?? null,
        };
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
};

export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    getMyPayments
};