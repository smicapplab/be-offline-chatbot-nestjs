import { Request } from 'express';

export interface RequestWithUser extends Request {
    user: {
        firstName: string,
        lastName: string,
        sub: number,
    };
}