"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = exports.AUTH_COOKIE_BASE_OPTIONS = void 0;
const env_1 = require("../config/env");
const parseDurationToMilliseconds = (duration) => {
    const match = duration.trim().match(/^(\d+)(ms|s|m|h|d|w)$/i);
    if (!match) {
        const parsedNumber = Number(duration);
        return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
    }
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const unitToMilliseconds = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    };
    return value * unitToMilliseconds[unit];
};
exports.AUTH_COOKIE_BASE_OPTIONS = {
    httpOnly: true,
    secure: env_1.envVars.NODE_ENV === "production",
    sameSite: env_1.envVars.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
};
const setAuthCookie = (res, tokenInfo) => {
    const accessTokenMaxAge = parseDurationToMilliseconds(env_1.envVars.JWT_ACCESS_EXPIRES);
    const refreshTokenMaxAge = parseDurationToMilliseconds(env_1.envVars.JWT_REFRESH_EXPIRES);
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, Object.assign(Object.assign({}, exports.AUTH_COOKIE_BASE_OPTIONS), { maxAge: accessTokenMaxAge }));
    }
    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, Object.assign(Object.assign({}, exports.AUTH_COOKIE_BASE_OPTIONS), { maxAge: refreshTokenMaxAge }));
    }
};
exports.setAuthCookie = setAuthCookie;
