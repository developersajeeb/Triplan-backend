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
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";

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
        const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice")

        if (!cloudinaryResult) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload invoice PDF to Cloudinary");
            throw new AppError(401, "Invoice could not be generated.")
        }

        await Payment.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: cloudinaryResult.secure_url }, { runValidators: true, session })

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

export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl
};