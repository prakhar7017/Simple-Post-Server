import { IUser } from "../schemas/UserSchema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface IResponseStatus {
    status_code: number;
    success: Boolean;
    data: any;
    error: any;
    timestamp: string | Date;
}

const initStatus: IResponseStatus = {
    status_code: 404,
    success: false,
    data: null,
    error: null,
    timestamp: null
};

export const makeResponseJson = (data: any, success = true) => {
    return {
        ...initStatus,
        status_code: 200,
        success,
        data,
        timestamp: new Date()
    };
}

export const hashPassword = async (password: string, saltRounds: number = 10): Promise<string> => {
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(saltRounds);

        // Hash the password with the salt
        const hashedPassword = await bcrypt.hash(password, salt);

        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        // Compare the provided password with the hashed password
        const passwordsMatch = await bcrypt.compare(password, hashedPassword);
        return passwordsMatch;
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};
export const generateJwtToken = (id: string, email: string, secretKey: string, expiresIn?: string | number): string => {
    try {
        // Create the payload
        const payload = {
            id,
            email
        };

        // Generate and return the JWT token
        return jwt.sign(payload, secretKey, { expiresIn });
    } catch (error) {
        throw new Error('Error generating JWT token');
    }
};

export const validateJwtToken = (token: string):  IUser | null => {
    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as IUser;
        return decoded;
    } catch (error) {
        // If token is invalid or expired, return null
        return null;
    }
};
