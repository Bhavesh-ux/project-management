import prisma from "../configs/prisma.js";
import { clerkClient } from "@clerk/express";

// ======================================================
// SYNC CLERK USER TO DATABASE
// ======================================================

const syncUserToDatabase = async (userId) => {
    const clerkUser = await clerkClient.users.getUser(userId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
        throw new Error("User email not found in Clerk");
    }

    const name =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        "User";

    const user = await prisma.user.upsert({
        where: { id: userId },
        update: { name, email, image: clerkUser.imageUrl || "" },
        create: { id: userId, name, email, image: clerkUser.imageUrl || "" }
    });

    console.log("USER SYNCED:", user.id);

    return user;
};

// ======================================================
// SYNC CURRENT USER
// ======================================================

export const syncCurrentUser = async (req, res) => {
    try {
        const { userId } = await req.auth();

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await syncUserToDatabase(userId);

        res.json({ message: "User synced successfully", user });

    } catch (error) {
        console.log("SYNC USER ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// ======================================================
// GET ALL WORKSPACES
// ======================================================

export const getUserWorkSpaces = async (req, res) => {
    try {
        const { userId } = await req.auth();

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await syncUserToDatabase(userId);

        const members = await prisma.workspaceMember.findMany({
            where: { userId: userId }
        });

        console.log("CLERK USER ID:", userId);
        console.log("MATCHING MEMBERS:", members);

        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: {
                            include: {
                                assignee: true,
                                comments: { include: { user: true } }
                            }
                        },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });

        console.log("WORKSPACES FOUND:", workspaces.length);

        res.json({ workspaces });

    } catch (error) {
        console.log("GET WORKSPACES ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

// ======================================================
// ADD MEMBER
// ======================================================

export const addMember = async (req, res) => {
    try {
        const { userId } = await req.auth();

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { email, role, workspaceId, message } = req.body;

        if (!email || !role || !workspaceId) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        if (!["ADMIN", "MEMBER"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await prisma.user.findUnique({ where: { email: email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const currentMember = workspace.members.find(
            (member) => member.userId === userId
        );

        if (!currentMember || currentMember.role !== "ADMIN") {
            return res.status(401).json({ message: "You do not have admin privileges" });
        }

        const existingMember = workspace.members.find(
            (member) => member.userId === user.id
        );

        if (existingMember) {
            return res.status(400).json({ message: "User is already a member" });
        }

        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspaceId,
                role: role,
                message: message || ""
            }
        });

        res.json({ member, message: "Member added successfully" });

    } catch (error) {
        console.log("ADD MEMBER ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};