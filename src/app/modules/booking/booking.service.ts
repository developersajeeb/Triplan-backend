/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Tour } from "../tour/tour.model";
import { User } from "../user/user.model";
import { BOOKING_STATUS, IBooking } from "./booking.interface";
import { Booking } from "./booking.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { getTransactionId } from "./getTransactionId";

type ICreateBookingPayload = Partial<IBooking> & {
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
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

const createBooking = async (payload: ICreateBookingPayload, userId: string) => {
  const transactionId = getTransactionId()

  const session = await Booking.startSession();
  session.startTransaction()

  try {
    let user = await User.findById(userId);

    const bookingDate = payload.date ? new Date(payload.date) : undefined;

    if (!bookingDate || Number.isNaN(bookingDate.getTime())) {
      // eslint-disable-next-line no-console
      console.warn("Invalid booking date provided:", payload.date);
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid booking date. Please select a valid date.")
    }

    if (!user) {
      // eslint-disable-next-line no-console
      console.error("User not found:", userId);
      throw new AppError(httpStatus.NOT_FOUND, "User not found. Please log in again.")
    }

    const normalizedPhone = payload.phone?.trim();
    const normalizedAddress = payload.address?.trim();
    const normalizedCountry = payload.country?.trim();
    const normalizedCity = payload.city?.trim();

    const shouldSyncProfile =
      (!user.phone && !!normalizedPhone) ||
      (!user.address && !!normalizedAddress) ||
      (!!normalizedCountry && normalizedCountry !== user.country) ||
      (!!normalizedCity && normalizedCity !== user.city);

    if (shouldSyncProfile) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...(normalizedPhone ? { phone: normalizedPhone } : {}),
          ...(normalizedAddress ? { address: normalizedAddress } : {}),
          ...(normalizedCountry ? { country: normalizedCountry } : {}),
          ...(normalizedCity ? { city: normalizedCity } : {}),
        },
        { new: true, runValidators: true, session }
      );

      if (updatedUser) {
        user = updatedUser;
      }
    }

    if (!user.phone || !user.address) {
      // eslint-disable-next-line no-console
      console.warn("User missing required fields for booking:", { userId, hasPhone: !!user.phone, hasAddress: !!user.address });
      throw new AppError(httpStatus.BAD_REQUEST, "Phone number and address are required. Please update your profile.")
    }

    const tour = await Tour.findById(payload.tour).select("costFrom batches")

    if (!tour) {
      // eslint-disable-next-line no-console
      console.error("Tour not found:", payload.tour);
      throw new AppError(httpStatus.NOT_FOUND, "Tour not found. Please select another tour.")
    }

    const bookingDateKeys = getDateKeys(bookingDate)
    const selectedBatch = tour.batches?.find((batch) => {
      const batchDateKeys = getDateKeys(batch.startDate)
      return [...batchDateKeys].some((key) => bookingDateKeys.has(key))
    })

    if (tour.batches?.length && !selectedBatch) {
      // eslint-disable-next-line no-console
      console.warn("Batch not found for date:", bookingDate);
      throw new AppError(httpStatus.BAD_REQUEST, "Selected tour batch is not available for the chosen date.")
    }

    if (selectedBatch && new Date() > new Date(selectedBatch.regEndDate)) {
      // eslint-disable-next-line no-console
      console.warn("Registration deadline passed for batch:", (selectedBatch as any)._id);
      throw new AppError(httpStatus.BAD_REQUEST, "Registration deadline for this batch has passed.")
    }

    const pricePerGuest = selectedBatch
      ? Number(selectedBatch.sellingPrice)
      : Number(tour.costFrom)

    if (!Number.isFinite(pricePerGuest) || pricePerGuest <= 0) {
      // eslint-disable-next-line no-console
      console.error("Invalid price calculated:", { pricePerGuest, batchPrice: selectedBatch?.sellingPrice, tourCost: tour.costFrom });
      throw new AppError(httpStatus.BAD_REQUEST, "Tour pricing information is missing. Please try again.")
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const amount = pricePerGuest * Number(payload.guestCount!)

    const booking = await Booking.create([{
      user: userId,
      status: BOOKING_STATUS.PENDING,
      tour: payload.tour,
      guestCount: payload.guestCount,
      date: bookingDate,
    }], { session })

    const payment = await Payment.create([{
      booking: booking[0]._id,
      status: PAYMENT_STATUS.UNPAID,
      transactionId: transactionId,
      amount: amount
    }], { session })

    const updatedBooking = await Booking
      .findByIdAndUpdate(
        booking[0]._id,
        { payment: payment[0]._id },
        { new: true, runValidators: true, session }
      )
      .populate("user", "name email phone address")
      .populate("tour", "title costFrom batches")
      .populate("payment");

    const userAddress = (updatedBooking?.user as any).address
    const userEmail = (updatedBooking?.user as any).email
    const userPhoneNumber = (updatedBooking?.user as any).phone
    const userName = (updatedBooking?.user as any).name

    const sslPayload: ISSLCommerz = {
      address: userAddress,
      email: userEmail,
      phoneNumber: userPhoneNumber,
      name: userName,
      amount: amount,
      transactionId: transactionId
    }
    const sslPayment = await SSLService.sslPaymentInit(sslPayload)
    const gatewayUrl = getGatewayUrl(sslPayment);

    if (!gatewayUrl) {
      // eslint-disable-next-line no-console
      console.error("Payment gateway URL not received from SSLCommerz", { sslPayment });
      throw new AppError(httpStatus.BAD_REQUEST, "Payment gateway connection failed. Please try again later.")
    }

    await session.commitTransaction(); //transaction
    session.endSession()
    return {
      paymentUrl: gatewayUrl,
      booking: updatedBooking
    }
  } catch (error) {
    await session.abortTransaction(); // rollback
    session.endSession()
    throw error
  }
};

// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Complete -> Backend(localhost:5000/api/v1/payment/success) -> Update Payment(PAID) & Booking(COMPLETE) -> redirect to frontend -> Frontend(localhost:5173/payment/success)
// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Fail / Cancel -> Backend(localhost:5000) -> Update Payment(FAIL / CANCEL) & Booking(FAIL / CANCEL) -> redirect to frontend -> Frontend(localhost:5173/payment/cancel or localhost:5173/payment/fail)

const checkAvailability = async (payload: {
  tour: string;
  date: string;
  guestCount: number;
}) => {
  const { tour, date, guestCount } = payload;

  const tourData = await Tour.findById(tour).select("batches regEndDate");
  if (!tourData) {
    // eslint-disable-next-line no-console
    console.warn("Tour not found in checkAvailability:", tour);
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found. Please select a valid tour.");
  }
  const selectedDate = new Date(date);

  if (Number.isNaN(selectedDate.getTime())) {
    // eslint-disable-next-line no-console
    console.warn("Invalid date format in checkAvailability:", date);
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid date format provided.");
  }

  const selectedDateKeys = getDateKeys(date);
  const selectedBatch = tourData.batches?.find((batch) => {
    const batchDateKeys = getDateKeys(batch.startDate);
    return [...batchDateKeys].some((key) => selectedDateKeys.has(key));
  });

  if (tourData.batches?.length && !selectedBatch) {
    return {
      available: false,
      remainingSeats: 0,
      message: "Selected batch is not available for the chosen date.",
    };
  }

  const maxGuest = selectedBatch ? Number(selectedBatch.maxSeat) : NaN;

  if (!Number.isFinite(maxGuest) || maxGuest <= 0) {
    // eslint-disable-next-line no-console
    console.error("Invalid tour seat configuration:", { maxGuest, batchInfo: selectedBatch?.maxSeat });
    throw new AppError(httpStatus.BAD_REQUEST, "Tour seat configuration is invalid.")
  }

  const regEndDate = selectedBatch
    ? new Date(selectedBatch.regEndDate)
    : tourData.regEndDate
      ? new Date(tourData.regEndDate)
      : undefined;

  if (!regEndDate) {
    // eslint-disable-next-line no-console
    console.error("Tour registration end date missing for tour:", tour);
    throw new AppError(httpStatus.BAD_REQUEST, "Tour registration information is missing. Please try again.");
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

  const bookings = await Booking.aggregate([
    {
      $match: {
        tour: tourData._id,
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
        // Reserve seats only for bookings with successful payment.
        status: BOOKING_STATUS.COMPLETE,
      },
    },
    {
      $group: {
        _id: null,
        totalBooked: { $sum: "$guestCount" },
      },
    },
  ]);

  const alreadyBooked = bookings[0]?.totalBooked || 0;
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
};

const getUserBookings = async () => {
  return {}
};

const getBookingById = async () => {
  return {}
};

const updateBookingStatus = async () => {
  return {}
};

const getAllBookings = async () => {
  return {}
};

export const BookingService = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  getAllBookings,
  checkAvailability
};