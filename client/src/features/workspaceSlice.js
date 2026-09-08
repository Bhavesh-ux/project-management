import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../configs/api";

// ======================================================
// FETCH WORKSPACES
// ======================================================

export const fetchWorkspaces = createAsyncThunk(
    "workspace/fetchWorkspaces",

    async ({ getToken }, { rejectWithValue }) => {
        try {
            const token = await getToken();

            if (!token) {
                return rejectWithValue(
                    "Authentication token not found"
                );
            }

            const { data } = await api.get(
                "/api/workspaces",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log(
                "WORKSPACES API RESPONSE:",
                data
            );

            return data.workspaces || [];

        } catch (error) {
            console.error(
                "FETCH WORKSPACES ERROR:",
                error?.response?.data || error.message
            );

            return rejectWithValue(
                error?.response?.data?.message ||
                error?.response?.data?.Message ||
                error.message ||
                "Failed to fetch workspaces"
            );
        }
    }
);

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
    error: null,
};

// ======================================================
// SLICE
// ======================================================

const workspaceSlice = createSlice({
    name: "workspace",

    initialState,

    reducers: {

        // ==================================================
        // SET WORKSPACES
        // ==================================================

        setWorkspaces: (state, action) => {
            state.workspaces = Array.isArray(action.payload)
                ? action.payload
                : [];

            if (
                !state.currentWorkspace &&
                state.workspaces.length > 0
            ) {
                state.currentWorkspace =
                    state.workspaces[0];

                localStorage.setItem(
                    "currentWorkspaceId",
                    state.workspaces[0].id
                );
            }
        },

        // ==================================================
        // SET CURRENT WORKSPACE
        // ==================================================

        setCurrentWorkspace: (state, action) => {
            const workspace = state.workspaces.find(
                (workspace) =>
                    workspace.id === action.payload
            );

            if (workspace) {
                state.currentWorkspace = workspace;

                localStorage.setItem(
                    "currentWorkspaceId",
                    workspace.id
                );
            }
        },

        // ==================================================
        // ADD WORKSPACE
        // ==================================================

        addWorkspace: (state, action) => {
            if (!action.payload) return;

            state.workspaces.push(action.payload);

            state.currentWorkspace =
                action.payload;

            localStorage.setItem(
                "currentWorkspaceId",
                action.payload.id
            );
        },

        // ==================================================
        // UPDATE WORKSPACE
        // ==================================================

        updateWorkspace: (state, action) => {
            if (!action.payload) return;

            state.workspaces =
                state.workspaces.map(
                    (workspace) =>
                        workspace.id === action.payload.id
                            ? action.payload
                            : workspace
                );

            if (
                state.currentWorkspace?.id ===
                action.payload.id
            ) {
                state.currentWorkspace =
                    action.payload;
            }
        },

        // ==================================================
        // DELETE WORKSPACE
        // ==================================================

        deleteWorkspace: (state, action) => {
            state.workspaces =
                state.workspaces.filter(
                    (workspace) =>
                        workspace.id !== action.payload
                );

            if (
                state.currentWorkspace?.id ===
                action.payload
            ) {
                state.currentWorkspace =
                    state.workspaces[0] || null;

                if (state.currentWorkspace) {
                    localStorage.setItem(
                        "currentWorkspaceId",
                        state.currentWorkspace.id
                    );
                } else {
                    localStorage.removeItem(
                        "currentWorkspaceId"
                    );
                }
            }
        },

        // ==================================================
        // ADD PROJECT
        // ==================================================

        addProject: (state, action) => {
            // Don't add undefined/null project
            if (
                !state.currentWorkspace ||
                !action.payload
            ) {
                return;
            }

            const workspaceId =
                state.currentWorkspace.id;

            state.workspaces =
                state.workspaces.map(
                    (workspace) => {

                        if (
                            workspace.id !== workspaceId
                        ) {
                            return workspace;
                        }

                        return {
                            ...workspace,

                            projects: [
                                ...(workspace.projects || [])
                                    .filter(Boolean),

                                action.payload,
                            ],
                        };
                    }
                );

            state.currentWorkspace =
                state.workspaces.find(
                    (workspace) =>
                        workspace.id === workspaceId
                );
        },

        // ==================================================
        // ADD TASK
        // ==================================================

        addTask: (state, action) => {
            if (
                !state.currentWorkspace ||
                !action.payload
            ) {
                return;
            }

            const workspaceId =
                state.currentWorkspace.id;

            state.workspaces =
                state.workspaces.map(
                    (workspace) => {

                        if (
                            workspace.id !== workspaceId
                        ) {
                            return workspace;
                        }

                        return {
                            ...workspace,

                            projects: (
                                workspace.projects || []
                            )
                                .filter(Boolean)
                                .map(
                                    (project) =>
                                        project.id ===
                                        action.payload.projectId
                                            ? {
                                                  ...project,

                                                  tasks: [
                                                      ...(project.tasks || [])
                                                          .filter(Boolean),

                                                      action.payload,
                                                  ],
                                              }
                                            : project
                                ),
                        };
                    }
                );

            state.currentWorkspace =
                state.workspaces.find(
                    (workspace) =>
                        workspace.id === workspaceId
                );
        },

        // ==================================================
        // UPDATE TASK
        // ==================================================

        updateTask: (state, action) => {
            if (
                !state.currentWorkspace ||
                !action.payload
            ) {
                return;
            }

            const workspaceId =
                state.currentWorkspace.id;

            state.workspaces =
                state.workspaces.map(
                    (workspace) => {

                        if (
                            workspace.id !== workspaceId
                        ) {
                            return workspace;
                        }

                        return {
                            ...workspace,

                            projects: (
                                workspace.projects || []
                            )
                                .filter(Boolean)
                                .map(
                                    (project) =>
                                        project.id ===
                                        action.payload.projectId
                                            ? {
                                                  ...project,

                                                  tasks: (
                                                      project.tasks || []
                                                  )
                                                      .filter(Boolean)
                                                      .map(
                                                          (task) =>
                                                              task.id ===
                                                              action.payload.id
                                                                  ? action.payload
                                                                  : task
                                                      ),
                                              }
                                            : project
                                ),
                        };
                    }
                );

            state.currentWorkspace =
                state.workspaces.find(
                    (workspace) =>
                        workspace.id === workspaceId
                );
        },

        // ==================================================
        // DELETE TASK
        // ==================================================

        deleteTask: (state, action) => {
            if (!state.currentWorkspace) {
                return;
            }

            const workspaceId =
                state.currentWorkspace.id;

            const taskIds = Array.isArray(
                action.payload
            )
                ? action.payload
                : [action.payload];

            state.workspaces =
                state.workspaces.map(
                    (workspace) => {

                        if (
                            workspace.id !== workspaceId
                        ) {
                            return workspace;
                        }

                        return {
                            ...workspace,

                            projects: (
                                workspace.projects || []
                            )
                                .filter(Boolean)
                                .map(
                                    (project) => ({
                                        ...project,

                                        tasks: (
                                            project.tasks || []
                                        )
                                            .filter(Boolean)
                                            .filter(
                                                (task) =>
                                                    !taskIds.includes(
                                                        task.id
                                                    )
                                            ),
                                    })
                                ),
                        };
                    }
                );

            state.currentWorkspace =
                state.workspaces.find(
                    (workspace) =>
                        workspace.id === workspaceId
                );
        },
    },

    // ======================================================
    // EXTRA REDUCERS
    // ======================================================

    extraReducers: (builder) => {

        // ==================================================
        // FETCH WORKSPACES - PENDING
        // ==================================================

        builder.addCase(
            fetchWorkspaces.pending,
            (state) => {
                state.loading = true;
                state.error = null;
            }
        );

        // ==================================================
        // FETCH WORKSPACES - FULFILLED
        // ==================================================

        builder.addCase(
            fetchWorkspaces.fulfilled,
            (state, action) => {

                const workspaces =
                    Array.isArray(action.payload)
                        ? action.payload
                        : [];

                console.log(
                    "REDUX WORKSPACES:",
                    workspaces
                );

                state.workspaces =
                    workspaces;

                state.error = null;

                // ------------------------------------------
                // No workspace
                // ------------------------------------------

                if (workspaces.length === 0) {

                    state.currentWorkspace =
                        null;

                    localStorage.removeItem(
                        "currentWorkspaceId"
                    );

                    state.loading = false;

                    return;
                }

                // ------------------------------------------
                // Get saved workspace ID
                // ------------------------------------------

                const savedWorkspaceId =
                    localStorage.getItem(
                        "currentWorkspaceId"
                    );

                // ------------------------------------------
                // Find saved workspace
                // ------------------------------------------

                const savedWorkspace =
                    workspaces.find(
                        (workspace) =>
                            workspace.id ===
                            savedWorkspaceId
                    );

                // ------------------------------------------
                // Select workspace
                // ------------------------------------------

                state.currentWorkspace =
                    savedWorkspace ||
                    workspaces[0];

                // ------------------------------------------
                // Save current workspace
                // ------------------------------------------

                localStorage.setItem(
                    "currentWorkspaceId",
                    state.currentWorkspace.id
                );

                state.loading = false;
            }
        );

        // ==================================================
        // FETCH WORKSPACES - REJECTED
        // ==================================================

        builder.addCase(
            fetchWorkspaces.rejected,
            (state, action) => {

                state.loading = false;

                state.error =
                    action.payload ||
                    "Failed to fetch workspaces";

                console.error(
                    "WORKSPACE FETCH REJECTED:",
                    state.error
                );
            }
        );
    },
});

// ======================================================
// EXPORT ACTIONS
// ======================================================

export const {
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addProject,
    addTask,
    updateTask,
    deleteTask,
} = workspaceSlice.actions;

// ======================================================
// EXPORT REDUCER
// ======================================================

export default workspaceSlice.reducer;