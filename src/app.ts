import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import express, { Application, Request, Response } from 'express';
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { router } from "./app/routes";
import expressSession from "express-session";
import { envVars } from "./app/config/env";
import "./app/config/passport";

const app: Application = express();

app.use(cors({
  origin: ["https://triplan.developersajeeb.com"], credentials: true
}));
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(expressSession({
  secret: envVars.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", router)

app.get('/', (req: Request, res: Response) => {
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

app.use(globalErrorHandler)
app.use(notFound)

export default app;