import type { Response } from 'express'

export function successResponse(res: Response, data: any, message: string = 'success') {
    res.status(200).json({
        success: true,
        message, 
        data
    })
}

export function errorResponse(res: Response, status: number, error: string) {
    res.status(status).json({
        success: false,
        error
    })
}