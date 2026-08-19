import express from "express";

import {
    getWorkspaceTables,
    createWorkspaceTable,
    updateWorkspaceTable,
    deleteWorkspaceTable,
    addWorkspaceColumn,
    getWorkspaceRecords,
    createWorkspaceRecord,
    updateWorkspaceRecord,
    deleteWorkspaceRecord,
    updateWorkspaceColumn,
    deleteWorkspaceColumn,
} from "../controllers/workspaceTableController.js";

const router = express.Router();

router.get("/", getWorkspaceTables);

router.post("/", createWorkspaceTable);

router.post("/:id/columns", addWorkspaceColumn);

router.get("/:id/records", getWorkspaceRecords);

router.post("/:id/records", createWorkspaceRecord);

router.put(
    "/:id/records/:recordId",
    updateWorkspaceRecord
);

router.delete(
    "/:id/records/:recordId",
    deleteWorkspaceRecord
);

router.put(
    "/:id/columns/:columnId",
    updateWorkspaceColumn
);

router.delete(
    "/:id/columns/:columnId",
    deleteWorkspaceColumn
);

router.put("/:id", updateWorkspaceTable);

router.delete("/:id", deleteWorkspaceTable);


export default router;