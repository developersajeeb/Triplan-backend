import { Types } from "mongoose";

export enum BOOKING_STATUS {
    PENDING = "PENDING",
    CANCEL = "CANCEL",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED"
}

export interface IBooking {
    user: Types.ObjectId,
    tour: Types.ObjectId,
    date: Date,
    payment?: Types.ObjectId,
    guestCount: number,
    status: BOOKING_STATUS
    createdAt?: Date
}

export interface TBookingQuery {
    search?: string;
    status?: string;
}

export interface TPopulatedTourBatch {
    batchNo?: number;
    costFrom?: number;
    sellingPrice?: number;
    startDate?: Date | string;
    startTime?: string;
    endDate?: Date | string;
    endTime?: string;
    regEndDate?: Date | string;
    maxSeat?: number;
    minAge?: number;
}

export interface TPopulatedBooking {
    _id?: string | Types.ObjectId;
    createdAt?: Date;
    batches?: TPopulatedTourBatch[];
    endDate?: Date;
    date?: Date;
    status?: BOOKING_STATUS;
    guestCount?: number;
    user?: unknown;
    tour?: {
        _id?: string;
        title?: string;
        slug?: string;
        images?: string[];
        arrivalLocation?: string;
        startDate?: Date | string;
        endDate?: Date | string;
        batches?: TPopulatedTourBatch[];
    };
    payment?: {
        _id?: string;
        status?: string;
        amount?: number;
        transactionId?: string;
        invoiceUrl?: string;
    };
}