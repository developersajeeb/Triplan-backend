import { Types } from "mongoose";

export interface IReview {
  user: Types.ObjectId;
  booking: Types.ObjectId;
  tour: Types.ObjectId;
  tourTitle: string;
  tourSlug: string;
  guideRating: number;
  serviceRating: number;
  transportationRating: number;
  organizationRating: number;
  comment: string;
  images: string[];
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReviewSummary {
  totalReviews: number;
  averageGuideRating: number;
  averageServiceRating: number;
  averageTransportationRating: number;
  averageOrganizationRating: number;
  overallRating: number;
}

export interface IReviewEligibility {
  canReview: boolean;
  hasBooked: boolean;
  alreadyReviewed: boolean;
  bookingId: string | null;
}

export interface ITourReviewResponse {
  summary: IReviewSummary;
  reviews: Array<{
    _id: string;
    name: string;
    picture?: string;
    createdAt: string;
    guideRating: number;
    serviceRating: number;
    transportationRating: number;
    organizationRating: number;
    comment: string;
    images: string[];
    overallRating: number;
  }>;
}
