import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';

let server: Server;

const PORT = 5000;

async function main() {
    try {
        await mongoose.connect("mongodb+srv://triplanbysajeeb:LbKKqc8mjjBpPFJ3@cluster0.d9amltv.mongodb.net/triplan?retryWrites=true&w=majority&appName=Cluster0");
        console.log('Server is connected to database!');
        server = app.listen(PORT, () => {
            console.log(`App is listening on port ${PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
}

main()