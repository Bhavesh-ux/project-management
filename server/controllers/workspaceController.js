
import prisma from "../configs/prisma.js";

// Get all workspaces for logged-in user
export const getUserWorkSpaces = async (req, res) => {
    try {
        const { userId } = await req.auth();

        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId: userId
                    }
                }
            },

            include: {
                members: {
                    include: {
                        user: true
                    }
                },

                projects: {
                    include: {
                        tasks: {
                            include: {
                                assignee: true,
                                comments: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        },

                        members: {
                            include: {
                                user: true
                            }
                        }
                    }
                },

                owner: true
            }
        });

        res.json({
            workspaces
        });

    } catch (error) {
        console.log("GET WORKSPACES ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// Add member to workspace
export const addMember = async (req, res) => {
    try {
        const { userId } = await req.auth();

        const {
            email,
            role,
            workspaceId,
            message
        } = req.body;


        // Check required parameters
        if (!email || !role || !workspaceId) {
            return res.status(400).json({
                message: "Missing required parameters"
            });
        }


        // Check valid role
        if (!["ADMIN", "MEMBER"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }


        // Find user by email
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        // Find workspace
        const workspace = await prisma.workspace.findUnique({
            where: {
                id: workspaceId
            },

            include: {
                members: true
            }
        });

        if (!workspace) {
            return res.status(404).json({
                message: "Workspace not found"
            });
        }


        // Check current user is ADMIN
        const currentMember = workspace.members.find(
            (member) => member.userId === userId
        );

        if (!currentMember || currentMember.role !== "ADMIN") {
            return res.status(401).json({
                message: "You do not have admin privileges"
            });
        }


        // Check if target user is already a member
        const existingMember = workspace.members.find(
            (member) => member.userId === user.id
        );

        if (existingMember) {
            return res.status(400).json({
                message: "User is already a member"
            });
        }


        // Create workspace member
        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspaceId,
                role: role,
                message: message
            }
        });


        res.json({
            member,
            message: "Member added successfully"
        });

    } catch (error) {
        console.log("ADD MEMBER ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};
