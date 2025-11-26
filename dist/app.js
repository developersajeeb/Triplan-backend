"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const express_1 = __importDefault(require("express"));
const globalErrorHandler_1 = require("./app/middlewares/globalErrorHandler");
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const routes_1 = require("./app/routes");
const express_session_1 = __importDefault(require("express-session"));
const env_1 = require("./app/config/env");
require("./app/config/passport");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173"], credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_session_1.default)({
    secret: env_1.envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax"
    }
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use("/api/v1", routes_1.router);
app.get('/', (req, res) => {
    res.send(`
    <html>
      <head>
        <title> App Api</title>
      </head>
      <body style="padding: 20px; margin: 0">
        <div style="background-color: #f2f2f2; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; border-radius: 20px">
            <h1 style="font-family: sans-serif;">TriPlan Api</h1>
        </div>
      </body>
    </html>
  `);
});
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(notFound_1.default);
exports.default = app;
