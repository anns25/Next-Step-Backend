import jwt from "jsonwebtoken";

export const authCheck = (req, res, next) =>{
    try{
        const SECRET_KEY = process.env.SECRET_KEY;
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({message : "Token not provided"});
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();

    }
    catch(err){
        res.status(403).json({message : "Authorization check failed"});
    }
}