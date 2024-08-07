import authConfig from "@config/auth.config";
import { SignJWT } from "jose";

const authToken = await new SignJWT({
    userId: "8bab9855-d437-4ce7-a560-094e54570d94"
}).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("nouro:fs:gc")
    .setAudience("nouro:fs:server")
    .sign(new TextEncoder().encode(authConfig.jwtSecret));

console.log(authToken)