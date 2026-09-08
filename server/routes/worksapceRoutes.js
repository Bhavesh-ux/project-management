import express from "express"
import { addMember, getUserWorkSpaces } from "../controllers/workspaceController.js";

const worksapceRouter = express.Router();

worksapceRouter.get('/',getUserWorkSpaces)
worksapceRouter.post('/add-member',addMember)


export default worksapceRouter