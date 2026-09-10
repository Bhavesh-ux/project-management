
import express from "express";

import {
    addMember,
    getUserWorkSpaces,
    syncCurrentUser
} from "../controllers/workspaceController.js";

const worksapceRouter = express.Router();


// Sync current Clerk user to Prisma
worksapceRouter.get("/sync-user", syncCurrentUser);


// Get user workspaces
worksapceRouter.get("/", getUserWorkSpaces);


// Add workspace member
worksapceRouter.post("/add-member", addMember);


export default worksapceRouter;