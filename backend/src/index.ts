import { connectDatabase } from "./database/connectDatabase";

const startServer = async ()=>{
    await connectDatabase();
    console.log("Backend server runnning");
    
}

startServer();