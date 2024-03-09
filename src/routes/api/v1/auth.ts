import { makeResponseJson } from "../../../helpers/utils";
import { ErrorHandler } from "../../../middlewares/error.middleware";
import { IUser } from "../../../schemas/UserSchema";
import { schemas, validateBody } from "../../../validations/validations";
import { NextFunction, Request, Response, Router } from "express";
import { User } from "../../../schemas/index";
import { hashPassword } from "../../../helpers/utils";
import UserService from "../../../Service/UserService";
import { comparePasswords,generateJwtToken  } from "../../../helpers/utils";
const router = Router({ mergeParams: true });

//@route POST /api/v1/auth/register
//@desc Register a new user
//@access Public
router.post("/register", validateBody(schemas.registerSchema), async (req: Request, res: Response, next: NextFunction) =>{
    try {
        const { email, password, username,firstname,lastname } = req.body;

        const user = await UserService.findUserByEmail(email);

        if (user) {
            return next(new ErrorHandler(400, "User already exists"));
        }
        
        const hashedPassword = await hashPassword(password);

        const payload={
            email,
            password: hashedPassword,
            username,
            firstname,
            lastname,
        }

        const newUser = await UserService.createUser(payload);

        return res.status(201).json(makeResponseJson(newUser, true));
    } catch (error) {
        next(new ErrorHandler(500, error.message));
    }
})

//@route POST /api/v1/auth/login
//@desc Login a user
//@access Public
router.post("/login", validateBody(schemas.loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await UserService.findUserByEmail(email);
        if (!user) {
            return next(new ErrorHandler(400, "Invalid credentials"));
        }

        // Compare passwords
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
            return next(new ErrorHandler(400, "Invalid credentials"));
        }

        // Generate JWT token
        const jwtToken = await generateJwtToken(user._id, user.email, process.env.JWT_SECRET, process.env.JWT_EXPIRE);

        // Set cookie with the JWT token
        res.cookie('jwt', jwtToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
            secure: process.env.NODE_ENV === 'production' // Set secure flag in production
        });

        // Respond with JWT token
        return res.status(200).json(makeResponseJson({ token: jwtToken }, true));
    } catch (error) {
        next(new ErrorHandler(500, error.message));
    }
});

export default router;