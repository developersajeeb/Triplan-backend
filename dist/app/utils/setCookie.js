"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = void 0;
const setAuthCookie = (res, tokenInfo) => {
    // if (tokenInfo.accessToken) {
    //     res.cookie("accessToken", tokenInfo.accessToken, {
    //         httpOnly: true,
    //         secure: true,
    //         sameSite: "none"
    //     })
    // }
    // if (tokenInfo.refreshToken) {
    //     res.cookie("refreshToken", tokenInfo.refreshToken, {
    //         httpOnly: true,
    //         secure: true,
    //         sameSite: "none"
    //     })
    // }
    res.cookie("accessToken", tokenInfo.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    });
    res.cookie("refreshToken", tokenInfo.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    });
};
exports.setAuthCookie = setAuthCookie;
