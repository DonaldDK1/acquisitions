import { createUser } from "#services/auth.service.js";
import { formatValidationError } from "#utils/format.js";
import { signUpSchema } from "#validations/auth.validation.js";
import logger from "../config/logger.js";
import { cookies } from "#utils/cookies.js";
import { jwttoken } from "#utils/jwt.js";

export const signup = async (req, res, next) => {
    try {
        const validationResult = signUpSchema.safeParse(req.body);

        if ( !validationResult.success ) {
            return res.status(400).json({ error: "Validation failed", details: formatValidationError(validationResult.error) });
        }

        const { name, email, password, role } = validationResult.data;

        const user = await createUser({ name, email, password, role });

        const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });

        cookies.set(res, "token ", token);

        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            message: "User registered successfully",
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        logger.error("Signup error", error);

        if (error.message == "User with this email already exists"){
            return res.status(400).json({ error: "User with this email already exists" });
        }

        next(error);
    }
};