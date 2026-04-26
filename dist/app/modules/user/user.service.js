"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const env_1 = require("../../config/env");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const user_constant_1 = require("./user.constant");
const user_interface_1 = require("./user.interface");
const user_model_1 = require("./user.model");
const mongoose_1 = require("mongoose");
const WISHLIST_LIMIT = 50;
const WISHLIST_POPULATE_FIELDS = "_id title slug arrivalLocation departureLocation location costFrom maxGuest divisionName tourTypeName images";
const normalizeWishlistObjectIds = (wishlist) => {
    if (!Array.isArray(wishlist)) {
        return [];
    }
    const flatList = wishlist.flat(Infinity);
    const ids = flatList
        .map((item) => {
        if (item instanceof mongoose_1.Types.ObjectId) {
            return item.toString();
        }
        if (typeof item === "string") {
            return item;
        }
        if (item && typeof item === "object" && "_id" in item) {
            const value = item._id;
            return typeof value === "string" ? value : "";
        }
        return "";
    })
        .filter((id) => mongoose_1.Types.ObjectId.isValid(id));
    return Array.from(new Set(ids)).map((id) => new mongoose_1.Types.ObjectId(id));
};
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phone, password } = payload, rest = __rest(payload, ["email", "phone", "password"]);
    const isUserExist = yield user_model_1.User.findOne({ email });
    const isUserExistWithPhone = yield user_model_1.User.findOne({ phone });
    if (isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Already Exist with this email.");
    }
    else if (isUserExistWithPhone) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Already Exist with this phone number.");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    const authProvider = { provider: "credentials", providerId: email };
    const user = yield user_model_1.User.create(Object.assign({ email,
        phone, password: hashedPassword, auths: [authProvider] }, rest));
    return user;
});
const updateUserService = (userId, payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const ifUserExist = yield user_model_1.User.findById(userId);
    if (!ifUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    if (payload.role) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.GUIDE) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
        if (payload.role === user_interface_1.Role.SUPER_ADMIN && decodedToken.role === user_interface_1.Role.ADMIN) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
    }
    if (payload.isActive !== undefined ||
        payload.isDeleted !== undefined ||
        payload.isVerified !== undefined) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.GUIDE) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
    }
    if (payload.password) {
        payload.password = yield bcryptjs_1.default.hash(payload.password, env_1.envVars.BCRYPT_SALT_ROUND);
    }
    const newUpdatedUser = yield user_model_1.User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
    return newUpdatedUser;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(user_model_1.User.find(), query);
    const usersData = queryBuilder
        .filter()
        .search(user_constant_1.userSearchableFields)
        .sort()
        .fields()
        .paginate();
    const [data, meta] = yield Promise.all([
        usersData.build(),
        queryBuilder.getMeta()
    ]);
    return {
        data,
        meta
    };
});
const getSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id).select("-password");
    return {
        data: user
    };
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    return {
        data: user
    };
});
const toggleWishlist = (userId, tourId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    user.wishlist = normalizeWishlistObjectIds(user.wishlist);
    const tourObjectId = new mongoose_1.Types.ObjectId(tourId);
    const exists = user.wishlist.some((id) => id.toString() === tourId);
    if (exists) {
        user.wishlist = user.wishlist.filter((id) => id.toString() !== tourId);
    }
    else {
        if (user.wishlist.length >= WISHLIST_LIMIT) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Wishlist limit reached. You can save up to 50 items only.");
        }
        user.wishlist.push(tourObjectId);
    }
    yield user.save();
    return {
        data: user.wishlist,
    };
});
const getWishlist = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield user_model_1.User.findByIdAndUpdate(userId, {
        $set: {
            wishlist: normalizeWishlistObjectIds((_a = (yield user_model_1.User.findById(userId).select("wishlist"))) === null || _a === void 0 ? void 0 : _a.wishlist),
        },
    });
    const user = yield user_model_1.User.findById(userId)
        .select("wishlist")
        .populate({
        path: "wishlist",
        select: WISHLIST_POPULATE_FIELDS,
    });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    return {
        data: user.wishlist
    };
});
exports.UserServices = {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUserService,
    getMe,
    toggleWishlist,
    getWishlist
};
