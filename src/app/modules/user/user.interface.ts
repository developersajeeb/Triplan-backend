import { Types } from "mongoose";

export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    USER = "USER",
    GUIDE = "GUIDE",
}

export interface IAuthProvider {
    provider: "google" | "credentials" | "facebook";
    providerId: string;
}

export enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED"
}

export interface IUser {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    password?: string;
    picture?: string;
    address?: string;
    country: string,
    city: string,
    post_code: string,
    isDeleted?: string;
    isActive?: IsActive;
    isVerified?: boolean;
    role: Role;
    auths: IAuthProvider[]
    bookings?: Types.ObjectId[]
    guides?: Types.ObjectId[]
    wishlist: Types.ObjectId[];
}