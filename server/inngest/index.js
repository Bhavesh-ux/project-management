import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

export const inngest = new Inngest({
  id: "project-management",
});

// ==================== CREATE USER ====================

const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [
      {
        event: "clerk/user.created",
      },
    ],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.create({
      data: {
        id: data.id,
        email: data.email_addresses[0]?.email_address,
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        image: data.image_url,
      },
    });
  }
);

// ==================== DELETE USER ====================

const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-with-clerk",
    triggers: [
      {
        event: "clerk/user.deleted",
      },
    ],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  }
);

// ==================== UPDATE USER ====================

const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [
      {
        event: "clerk/user.updated",
      },
    ],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data.email_addresses[0]?.email_address,
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        image: data.image_url,
      },
    });
  }
);

// ==================== CREATE WORKSPACE ====================

const syncWorkspaceCreation = inngest.createFunction(
  {
    id: "sync-workspace-from-clerk",
    triggers: [
      {
        event: "clerk/organization.created",
      },
    ],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      },
    });

    // Add creator as ADMIN member
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      },
    });
  }
);

// ==================== UPDATE WORKSPACE ====================

const syncWorkspaceUpdation = inngest.createFunction(
  {
    id: "update-workspace-from-clerk",
    triggers: [
      {
        event: "clerk/organization.updated",
      },
    ],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      },
    });
  }
);

// ==================== DELETE WORKSPACE ====================

const syncWorkspaceDeletion = inngest.createFunction(
  {
    id: "delete-workspace-with-clerk",
    triggers: [
      {
        event: "clerk/organization.deleted",
      },
    ],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.delete({
      where: {
        id: data.id,
      },
    });
  }
);

// ==================== CREATE WORKSPACE MEMBER ====================

const syncWorkspaceMemberCreation = inngest.createFunction(
  {
    id: "sync-workspace-member-from-clerk",
    triggers: [
      {
        event: "clerk/organizationInvitation.accepted",
      },
    ],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase(),
      },
    });
  }
);

// ==================== EXPORT FUNCTIONS ====================

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  syncWorkspaceMemberCreation,
];

