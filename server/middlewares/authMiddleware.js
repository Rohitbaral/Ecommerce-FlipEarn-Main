import {clerkClient, getAuth} from "@clerk/express"

export const protect = async (req, res, next) => {
    try {
        const {userId} = getAuth(req);

        if(!userId){
            return res.status(401).json({message: "Unauthorized"})
        }

        // Fetch user from Clerk to get publicMetadata
        const user = await clerkClient.users.getUser(userId);
        req.plan = user.publicMetadata?.plan === 'premium' ? 'premium' : 'free';

        return next()
    } catch (error) {
        console.log(error);
        res.status(401).json({message: error.code || error.message});
    }
    
}

export const protectAdmin = async (req, res, next) => {
    try {
        const {userId} = getAuth(req);

        if(!userId){
            return res.status(401).json({message: "Unauthorized"})
        }

        const user = await clerkClient.users.getUser(userId);
        const userEmails = user.emailAddresses.map(e => e.emailAddress?.toLowerCase().trim());
        const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",").map(e => e.replace(/['"]+/g, '').toLowerCase().trim()) : [];
        
        const isAdmin = userEmails.some(email => adminEmails.includes(email));

        if(!isAdmin){
            return res.status(401).json({message: "Unauthorized"})
        }
        return next()
    } catch (error) {
        console.log(error);
        res.status(401).json({message: error.code || error.message});
    }
    
}