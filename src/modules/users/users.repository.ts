import { prisma } from "../../database/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  accessProfileId: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  accessProfile: {
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
    },
  },
};

export class UsersRepository {
  create(data: {
    name?: string;
    email: string;
    passwordHash: string;
    accessProfileId: string;
  }) {
    return prisma.user.create({
      data: {
        ...(data.name !== undefined && { name: data.name }),
        email: data.email,
        passwordHash: data.passwordHash,
        accessProfile: {
          connect: { id: data.accessProfileId },
        },
      },
      select: userSelect,
    });
  }

  findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });
  }

  findByEmailExcludingId(email: string, id: string) {
    return prisma.user.findFirst({
      where: {
        email,
        id: { not: id },
      },
      select: {
        id: true,
      },
    });
  }

  findAccessProfileById(id: string) {
    return prisma.accessProfile.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
      accessProfileId?: string;
      status?: string;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.passwordHash !== undefined && {
          passwordHash: data.passwordHash,
        }),
        ...(data.accessProfileId !== undefined && {
          accessProfile: {
            connect: { id: data.accessProfileId },
          },
        }),
        ...(data.status !== undefined && { status: data.status }),
      },
      select: userSelect,
    });
  }
}
