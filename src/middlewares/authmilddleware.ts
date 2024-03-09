import {validateJwtToken} from '../helpers/utils';
import { Request, Response, NextFunction } from 'express';  


export const jwtTokenValidator = (req: Request, res: Response, next: NextFunction) => {
    // Get the JWT token from the request headers or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;

    if (!token) {
        // If token is not provided, return unauthorized
        return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    // Validate the token
    const decodedToken = validateJwtToken(token);

    if (!decodedToken) {
        // If token is invalid or expired, return unauthorized
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    // Add the decoded token to the request object
    req.user = decodedToken;

    // Call the next middleware
    next();
};