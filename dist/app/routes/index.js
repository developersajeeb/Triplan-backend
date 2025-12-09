"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_router_1 = require("../modules/user/user.router");
const auth_route_1 = require("../modules/auth/auth.route");
const division_route_1 = require("../modules/division/division.route");
const tour_route_1 = require("../modules/tour/tour.route");
const booking_route_1 = require("../modules/booking/booking.route");
const payment_route_1 = require("../modules/payment/payment.route");
const otp_routes_1 = require("../modules/otp/otp.routes");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/user",
        route: user_router_1.UserRoutes
    },
    {
        path: "/auth",
        route: auth_route_1.AuthRoutes
    },
    {
        path: "/division",
        route: division_route_1.DivisionRoutes
    },
    {
        path: "/tour",
        route: tour_route_1.TourRoutes
    },
    {
        path: "/booking",
        route: booking_route_1.BookingRoutes
    },
    {
        path: "/payment",
        route: payment_route_1.PaymentRoutes
    },
    {
        path: "/otp",
        route: otp_routes_1.OtpRoutes
    },
    // {
    //     path: "/stats",
    //     route: StatsRoutes
    // },
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
// router.use("/user", UserRoutes)
// router.use("/tour", TourRoutes)
// router.use("/division", DivisionRoutes)
// router.use("/booking", BookingRoutes)
// router.use("/user", UserRoutes)
