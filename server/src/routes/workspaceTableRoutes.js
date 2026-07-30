import express from "express";

import {

    getWorkspaceTables,
    createWorkspaceTable,
    updateWorkspaceTable,
    deleteWorkspaceTable,

} from "../controllers/workspaceTableController.js";

const router = express.Router();

router.get("/", getWorkspaceTables);

router.post("/", createWorkspaceTable);

router.put("/:id", updateWorkspaceTable);

router.delete("/:id", deleteWorkspaceTable);


export default router;