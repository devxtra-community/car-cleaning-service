import {NextFunction, Request, Response} from 'express'
import {logger} from '../src/config/logger'
export function globalErrorHandler(
    err:unknown,
    req: Request,
    res: Response,
    next: NextFunction
){
    if(err instanceof Error){
        logger.error("Unhandled error occured",{
            path:req.path,
            method:req.method,
            message:err.message,
            stack:err.stack
        })
    }else{
        logger.error("non-error thrown",{
            path:req.path,
            method:req.method,
            error:err,
        })
    }
    res.status(500).json({
        status:'error',
        message:'internal server error',
        timeStamp: new Date().toString()
    })
}