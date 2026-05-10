import { Response } from "express";
import { envVars } from "../config/env";

export interface AuthTokens {
    accessToken?: string;
    refreshToken?: string;
}

const parseDurationToMilliseconds = (duration: string) => {
    const match = duration.trim().match(/^(\d+)(ms|s|m|h|d|w)$/i);

    if (!match) {
        const parsedNumber = Number(duration);
        return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    const unitToMilliseconds: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    };

    return value * unitToMilliseconds[unit];
};

export const AUTH_COOKIE_BASE_OPTIONS = {
    httpOnly: true,
    secure: envVars.NODE_ENV === "production",
    sameSite: envVars.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
} as const;

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
    const accessTokenMaxAge = parseDurationToMilliseconds(envVars.JWT_ACCESS_EXPIRES);
    const refreshTokenMaxAge = parseDurationToMilliseconds(envVars.JWT_REFRESH_EXPIRES);

    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, {
            ...AUTH_COOKIE_BASE_OPTIONS,
            maxAge: accessTokenMaxAge,
        });
    }

    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, {
            ...AUTH_COOKIE_BASE_OPTIONS,
            maxAge: refreshTokenMaxAge,
        });
    }
}