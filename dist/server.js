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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./app/config/env");
const seedSuperAdmin_1 = require("./app/utils/seedSuperAdmin");
const redis_config_1 = require("./app/config/redis.config");
let server;
function StartServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(env_1.envVars.NODE_ENV);
            yield mongoose_1.default.connect(env_1.envVars.DB_URL);
            console.log('Server is connected to database!');
            server = app_1.default.listen(env_1.envVars.PORT, () => {
                console.log(`App is listening on port ${env_1.envVars.PORT}`);
            });
        }
        catch (error) {
            console.log(error);
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, redis_config_1.connectRedis)();
    yield StartServer();
    yield (0, seedSuperAdmin_1.seedSuperAdmin)();
}))();
process.on('unhandledRejection', error => {
    console.log("Unhandled Rejection detected..! Server shutting down.", error);
    if (server) {
        server.close(() => {
            console.log(error);
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on('uncaughtException', error => {
    console.log("uncaughtException exception detected..! Server shutting down.", error);
    if (server) {
        server.close(() => {
            console.log(error);
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on('SIGTERM', () => {
    console.log("SIGTERM is received! Server shutting down.");
    if (server) {
        server.close();
    }
    else {
        process.exit(1);
    }
});
process.on('SIGINT', () => {
    console.log("SIGINT is received! Server shutting down.");
    if (server) {
        server.close();
    }
    else {
        process.exit(1);
    }
});
