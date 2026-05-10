import { Types } from "mongoose";

export enum ENQUIRY_STATUS {
  UNREAD = "UNREAD",
  READ = "READ",
  REPLIED = "REPLIED",
}

export interface IEnquiry {
  name: string;
  email: string;
  phone: string;
  message: string;
  tourTitle?: string;
  tourSlug?: string;
  status: ENQUIRY_STATUS;
  replyMessage?: string;
  repliedAt?: Date;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEnquiryQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  sort?: string;
}

export interface IAdminEnquiryItem {
  _id: string | Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  message: string;
  tourTitle?: string;
  tourSlug?: string;
  status: ENQUIRY_STATUS;
  replyMessage?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt?: string;
}