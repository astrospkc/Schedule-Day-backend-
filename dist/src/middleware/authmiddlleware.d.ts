import express from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
declare const fetchuser: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<express.Response<any, Record<string, any>> | undefined>;
export default fetchuser;
//# sourceMappingURL=authmiddlleware.d.ts.map