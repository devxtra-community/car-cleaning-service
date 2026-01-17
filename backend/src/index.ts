import express from 'express'
import { logger } from './config/logger'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
app.use(express.json())

const PORT = 3000

app.get("/health",(req,res)=>{
    logger.info("Health check requested")

    res.status(200).json({
        status:'ok',
        uptime:process.uptime(),
        timeStamp: new Date().toString()
    })
})
app.listen(PORT,()=>{
    logger.info(`Server started on port ${PORT}`)
})