export type MonobankCurrency = {
    currencyCodeA: number;
    currencyCodeB: number;
    date: number;
    rateBuy: number;
    rateSell: number;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type LoginResponseType = {
    accessToken: string;
    refreshToken: string;
    userId: string;
};

export type ForgotPasswordPayload = {
    email: string;
};

export type ForgotPasswordResponseType = {
    message: string;
};

export type ResetPasswordPayload = {
    resetToken: string | null;
    newPassword: string;
};

export type ResetPasswordResponseType = {
    message: string;
};

export type RegistrationPayload = {
    name: string;
    email: string;
    password: string;
    verificationCode: string;
};

export type RegistrationResponseType = {
    accessToken: string;
    refreshToken: string;
};

export type LogoutPayload = {
    refreshToken?: string;
};

export type SessionDeviceType = "desktop" | "mobile" | "tablet";

export type SessionMethod = "password" | "google" | "legacy";

export type SessionEndReason = "logout" | "revoked" | "password-changed" | "password-reset" | "expired";

export type AccountSession = {
    id: string;
    browser: string;
    os: string;
    deviceType: SessionDeviceType;
    ip: string;
    method: SessionMethod;
    createdAt: string;
    lastActiveAt: string;
    expiresAt: string;
    active: boolean;
    current: boolean;
    endedAt?: string;
    endReason?: SessionEndReason;
};

export type AccountSessionsResponse = {
    active: AccountSession[];
    recent: AccountSession[];
};

export type RemoveSessionResponse = {
    message: string;
    current: boolean;
};

export type LogoutResponseType = {
    message: string;
};

export type AccountResponse = {
    name: string;
    email: string;
    registeredVia: "local" | "google";
    hasPassword: boolean;
};

export type ChangePasswordPayload = {
    oldPassword?: string;
    newPassword: string;
};

export type ChangePasswordResponseType = {
    message: string;
};
