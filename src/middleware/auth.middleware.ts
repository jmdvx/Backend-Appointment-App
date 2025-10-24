import { Request, Response, NextFunction } from 'express';
import { collections } from '../database';
import { User } from '../models/user';
import { ObjectId } from 'mongodb';

export const authenticateKey = async (req : Request, res : Response, next : NextFunction) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({'message' : 'Unauthorized: API key is missing'});
    }
    next();
}

// Authentication middleware - checks if user is logged in
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Find user by ID
        const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid user' });
        }
        
        // Add user to request object for use in routes
        (req as any).user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Authorization middleware - checks if user has admin role
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user as User;
        
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (user.role !== 'admin' && !user.roles?.includes('admin')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        res.status(403).json({ error: 'Authorization failed' });
    }
};

// Optional authentication - doesn't fail if no user, but adds user to request if present
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        
        if (userId) {
            const user = await collections.users?.findOne({ _id: new ObjectId(userId) }) as unknown as User;
            if (user) {
                (req as any).user = user;
            }
        }
        
        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        next(); // Continue even if auth fails
    }
};
