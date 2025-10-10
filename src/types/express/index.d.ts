import { User } from "../../models/user";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        // Add other user properties here if needed
      };
    }
  }
}
