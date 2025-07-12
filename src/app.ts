import cors from "cors";
import express, { Application, Request, Response } from 'express';
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { router } from "./app/routes";

const app: Application = express();
app.use(express.json());
app.use(cors())

app.use("/api/v1", router)

app.get('/', (req: Request, res: Response) => {
    res.send(`
    <html>
      <head>
        <title>Library Management App Api</title>
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