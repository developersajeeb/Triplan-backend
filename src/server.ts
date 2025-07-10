/* eslint-disable no-console */
import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import { envVars } from './app/config/env';

let server: Server;

async function StartServer() {
    try {
        console.log(envVars.NODE_ENV);
        
        await mongoose.connect(envVars.DB_URL);
        console.log('Server is connected to database!');
        server = app.listen(envVars.PORT, () => {
            console.log(`App is listening on port ${envVars.PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
}
StartServer()

process.on('unhandledRejection', error => {
    console.log("Unhandled Rejection detected..! Server shutting down.", error);
    if (server) {
        server.close(() => {
            console.log(error);
            process.exit(1);
        });
    } else {
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
    } else {
        process.exit(1);
    }
});

process.on('SIGTERM', () => {
    console.log("SIGTERM is received! Server shutting down.");
    if (server) {
        server.close();
    } else {
        process.exit(1);
    }
});

process.on('SIGINT', () => {
    console.log("SIGINT is received! Server shutting down.");
    if (server) {
        server.close();
    } else {
        process.exit(1);
    }
});