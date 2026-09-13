import { Webhook } from "svix";
import prisma from "../configs/prisma.js";

export const clerkWebhookHandler = async (req, res) => {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            throw new Error("CLERK_WEBHOOK_SECRET is missing in .env");
        }

        const svix_id = req.headers["svix-id"];
        const svix_timestamp = req.headers["svix-timestamp"];
        const svix_signature = req.headers["svix-signature"];

        if (!svix_id || !svix_timestamp || !svix_signature) {
            return res.status(400).json({ message: "Missing svix headers" });
        }

        const wh = new Webhook(WEBHOOK_SECRET);

        let evt;

        try {
            evt = wh.verify(req.body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            });
        } catch (err) {
            console.log("WEBHOOK VERIFICATION FAILED:", err.message);
            return res.status(400).json({ message: "Webhook verification failed" });
        }

        const eventType = evt.type;
        const data = evt.data;

        console.log("CLERK WEBHOOK EVENT:", eventType);

        // ==================================================
        // ORGANIZATION CREATED -> Create Workspace
        // ==================================================

        if (eventType === "organization.created") {
            const { id, name, slug, image_url, created_by } = data;

            await prisma.workspace.upsert({
                where: { id: id },
                update: {
                    name: name,
                    slug: slug,
                    image_url: image_url || "",
                },
                create: {
                    id: id,
                    name: name,
                    slug: slug,
                    image_url: image_url || "",
                    ownerId: created_by,
                },
            });

            // Add creator as ADMIN member
            await prisma.workspaceMember.upsert({
                where: {
                    userId_workspaceId: {
                        userId: created_by,
                        workspaceId: id,
                    },
                },
                update: {},
                create: {
                    userId: created_by,
                    workspaceId: id,
                    role: "ADMIN",
                },
            });

            console.log("WORKSPACE CREATED FROM WEBHOOK:", id);
        }

        // ==================================================
        // ORGANIZATION MEMBERSHIP CREATED -> Add Member
        // ==================================================

        if (eventType === "organizationMembership.created") {
            const { organization, public_user_data, role } = data;

            const workspaceId = organization.id;
            const userId = public_user_data.user_id;

            const memberRole = role === "org:admin" ? "ADMIN" : "MEMBER";

            await prisma.workspaceMember.upsert({
                where: {
                    userId_workspaceId: {
                        userId: userId,
                        workspaceId: workspaceId,
                    },
                },
                update: { role: memberRole },
                create: {
                    userId: userId,
                    workspaceId: workspaceId,
                    role: memberRole,
                },
            });

            console.log("MEMBER ADDED FROM WEBHOOK:", userId, workspaceId);
        }

        // ==================================================
        // ORGANIZATION DELETED -> Delete Workspace
        // ==================================================

        if (eventType === "organization.deleted") {
            const { id } = data;

            await prisma.workspace.delete({
                where: { id: id },
            }).catch(() => {
                // Ignore if already deleted
            });

            console.log("WORKSPACE DELETED FROM WEBHOOK:", id);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.log("WEBHOOK ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};