import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ENQUIRY_STATUS, IAdminEnquiryItem, IEnquiryQuery } from "./enquiry.interface";
import { Enquiry } from "./enquiry.model";

const normalizeText = (value?: string) => (value ?? "").trim().toLowerCase();

const getEnquiries = async (query: IEnquiryQuery = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const search = normalizeText(query.search);
  const statusFilter = normalizeText(query.status);
  const sort = normalizeText(query.sort) || "newest";

  const enquiries = await Enquiry.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

  const mapped: IAdminEnquiryItem[] = enquiries
    .map((enquiry) => ({
      _id: String(enquiry._id),
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      message: enquiry.message,
      tourTitle: enquiry.tourTitle,
      tourSlug: enquiry.tourSlug,
      status: enquiry.status,
      replyMessage: enquiry.replyMessage,
      repliedAt: enquiry.repliedAt ? enquiry.repliedAt.toISOString() : undefined,
      createdAt: enquiry.createdAt ? enquiry.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: enquiry.updatedAt ? enquiry.updatedAt.toISOString() : undefined,
    }))
    .filter((enquiry) => {
      const matchesSearch = search
        ? [enquiry.name, enquiry.email, enquiry.phone, enquiry.message, enquiry.tourTitle]
            .filter(Boolean)
            .some((field) => normalizeText(String(field)).includes(search))
        : true;

      const matchesStatus = statusFilter
        ? (statusFilter === "all"
          ? true
          : enquiry.status.toLowerCase() === statusFilter)
        : true;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const createdA = new Date(a.createdAt).getTime();
      const createdB = new Date(b.createdAt).getTime();

      if (sort === "oldest") {
        return createdA - createdB;
      }

      return createdB - createdA;
    });

  const total = mapped.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;

  return {
    data: mapped.slice(startIndex, startIndex + limit),
    meta: {
      page,
      limit,
      total,
      totalPage: totalPages,
      totalPages,
      totalListing: total,
    },
  };
};

const createEnquiry = async (payload: {
  name: string;
  email: string;
  phone: string;
  message: string;
  tourTitle?: string;
  tourSlug?: string;
}) => {
  const enquiry = await Enquiry.create({
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    message: payload.message.trim(),
    tourTitle: payload.tourTitle?.trim(),
    tourSlug: payload.tourSlug?.trim(),
    status: ENQUIRY_STATUS.UNREAD,
  });

  return enquiry;
};

const updateEnquiry = async (
  enquiryId: string,
  payload: {
    status?: ENQUIRY_STATUS;
    replyMessage?: string;
  }
) => {
  const enquiry = await Enquiry.findOne({
    _id: enquiryId,
    isDeleted: { $ne: true },
  });

  if (!enquiry) {
    throw new AppError(httpStatus.NOT_FOUND, "Enquiry not found.");
  }

  if (payload.status) {
    enquiry.status = payload.status;
  }

  if (typeof payload.replyMessage === "string") {
    const replyMessage = payload.replyMessage.trim();

    if (replyMessage) {
      enquiry.replyMessage = replyMessage;
      enquiry.repliedAt = new Date();
      enquiry.status = ENQUIRY_STATUS.REPLIED;
    }
  }

  if (!payload.replyMessage && payload.status === ENQUIRY_STATUS.READ) {
    enquiry.status = ENQUIRY_STATUS.READ;
  }

  await enquiry.save();

  return enquiry;
};

const deleteEnquiry = async (enquiryId: string) => {
  const enquiry = await Enquiry.findOne({
    _id: enquiryId,
    isDeleted: { $ne: true },
  }).select("_id");

  if (!enquiry) {
    throw new AppError(httpStatus.NOT_FOUND, "Enquiry not found.");
  }

  await Enquiry.findByIdAndUpdate(enquiry._id, { isDeleted: true }, { new: true });

  return {
    _id: String(enquiry._id),
  };
};

export const EnquiryService = {
  createEnquiry,
  getEnquiries,
  updateEnquiry,
  deleteEnquiry,
};