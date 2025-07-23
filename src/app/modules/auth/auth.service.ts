/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { IAuthProvider } from "../user/user.interface";

const getNewAccessToken = async (refreshToken: string) => {
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);
    return {
        accessToken: newAccessToken
    };
};

const resetPassword = async (payload: Record<string, any>, decodedToken: JwtPayload, p0: JwtPayload) => {
    if (payload.id != decodedToken.userId) {
        throw new AppError(401, "You can not reset your password")
    }

    const isUserExist = await User.findById(decodedToken.userId)
    if (!isUserExist) {
        throw new AppError(401, "User does not exist")
    }

    const hashedPassword = await bcryptjs.hash(
        payload.newPassword,
        Number(envVars.BCRYPT_SALT_ROUND)
    )
    isUserExist.password = hashedPassword;

    await isUserExist.save()
}

const setPassword = async (userId: string, plainPassword: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, "User not found");
    }

    if (user.password && user.auths.some(providerObject => providerObject.provider === "google")) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already set you password. Now you can change the password from your profile password update")
    }

    const hashedPassword = await bcryptjs.hash(
        plainPassword,
        Number(envVars.BCRYPT_SALT_ROUND)
    )

    const credentialProvider: IAuthProvider = {
        provider: "credentials",
        providerId: user.email
    }

    const auths: IAuthProvider[] = [...user.auths, credentialProvider]

    user.password = hashedPassword

    user.auths = auths

    await user.save()

}
const changePassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {

    const user = await User.findById(decodedToken.userId)
    const isOldPasswordMatch = await bcryptjs.compare(oldPassword, user!.password as string)
    if (!isOldPasswordMatch) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Old Password does not match");
    }

    user!.password = await bcryptjs.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND))
    user!.save();
}

export const AuthServices = {
    getNewAccessToken,
    resetPassword,
    setPassword,
    changePassword
}