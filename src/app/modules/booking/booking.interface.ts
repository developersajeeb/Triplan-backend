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