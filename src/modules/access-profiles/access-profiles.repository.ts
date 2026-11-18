import { prisma } from "../../database/prisma.js";

const accessProfileInclude = {
  profilePermissions: {
    include: {
      permission: true,
    },
  },
  _count: {
    select: {
      users: true,
    },
  },
};

export class AccessProfilesRepository {
  async findAll() {
    return prisma.accessProfile.findMany({
      include: accessProfileInclude,
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(id: string) {
    return prisma.accessProfile.findUnique({
      where: { id },
      include: accessProfileInclude,
    });
  }

  async findByName(name: string) {
    return prisma.accessProfile.findUnique({
      where: { name },
      select: { id: true },
    });
  }

  async findByNameExcludingId(name: string, id: string) {
    return prisma.accessProfile.findFirst({
      where: {
        name,
        NOT: { id },
      },
      select: { id: true },
    });
  }

  async findPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  }

  async findPermissionsByCodes(codes: string[]) {
    return prisma.permission.findMany({
      where: {
        code: { in: codes },
      },
      select: { id: true, code: true },
    });
  }

  async findUsersCountByProfileId(accessProfileId: string) {
    return prisma.user.count({
      where: { accessProfileId },
    });
  }

  async create(data: {
    name: string;
    description?: string | null;
    permissionIds: string[];
  }) {
    return prisma.$transaction(async (transaction) => {
      const profile = await transaction.accessProfile.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });

      if (data.permissionIds.length > 0) {
        await transaction.profilePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            accessProfileId: profile.id,
            permissionId,
          })),
        });
      }

      return transaction.accessProfile.findUniqueOrThrow({
        where: { id: profile.id },
        include: accessProfileInclude,
      });
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      status?: string;
      permissionIds?: string[];
    },
  ) {
    return prisma.$transaction(async (transaction) => {
      const { permissionIds, ...profileData } = data;

      if (Object.keys(profileData).length > 0) {
        await transaction.accessProfile.update({
          where: { id },
          data: profileData,
        });
      }

      if (permissionIds !== undefined) {
        await transaction.profilePermission.deleteMany({
          where: { accessProfileId: id },
        });

        if (permissionIds.length > 0) {
          await transaction.profilePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              accessProfileId: id,
              permissionId,
            })),
          });
        }
      }

      return transaction.accessProfile.findUniqueOrThrow({
        where: { id },
        include: accessProfileInclude,
      });
    });
  }
}
