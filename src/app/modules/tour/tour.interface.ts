import { Types } from "mongoose";

export interface ITourType {
    name: string;
}

export interface IFaqItem {
    question: string;
    answer: string;
}

export interface ITourBatch {
    batchNo: number;
    costFrom: number;
    sellingPrice: number;
    startDate: Date;
    startTime: string;
    endDate: Date;
    endTime: string;
    regEndDate: Date;
    maxSeat: number;
    minAge?: number;
}

export interface ITour {
    title: string;
    slug: string;
    description?: string;
    images?: string[];
    costFrom?: number;
    sellingPrice?: number;
    startDate?: Date;
    regEndDate: Date;
    divisionName: string;
    tourTypeName: string;
    departureLocation?: string;
    arrivalLocation?: string;
    endDate?: Date;
    included?: string[];
    excluded?: string[]
    amenities?: string[];
    tourPlan?: string[];
    faq?: IFaqItem[];
    batches?: ITourBatch[];
    minAge?: number;
    division: Types.ObjectId
    tourType: Types.ObjectId
    deleteImages?: string[]
}