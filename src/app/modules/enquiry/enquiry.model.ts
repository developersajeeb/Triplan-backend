import { model, Schema } from "mongoose";
import { ENQUIRY_STATUS, IEnquiry } from "./enquiry.interface";

const enquirySchema = new Schema<IEnquiry>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    tourTitle: {
      type: String,
      trim: true,
    },
    tourSlug: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ENQUIRY_STATUS),
      default: ENQUIRY_STATUS.UNREAD,
    },
    replyMessage: {
      type: String,
      trim: true,
    },
    repliedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ email: 1, name: 1 });

export const Enquiry = model<IEnquiry>("Enquiry", enquirySchema);