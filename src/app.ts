import express, { Application, Request, Response } from 'express';
const app: Application = express();
app.use(express.json());


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

export default app;