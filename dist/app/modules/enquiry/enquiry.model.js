"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enquiry = void 0;
const mongoose_1 = require("mongoose");
const enquiry_interface_1 = require("./enquiry.interface");
const enquirySchema = new mongoose_1.Schema({
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
        enum: Object.values(enquiry_interface_1.ENQUIRY_STATUS),
        default: enquiry_interface_1.ENQUIRY_STATUS.UNREAD,
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
}, {
    timestamps: true,
});
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ email: 1, name: 1 });
exports.Enquiry = (0, mongoose_1.model)("Enquiry", enquirySchema);
