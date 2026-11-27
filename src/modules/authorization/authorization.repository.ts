import { prisma } from "../../database/prisma.js";

export class AuthorizationRepository {
  async hasPermission(
    accessProfileId: string,
    permissionCode: string,
  ): Promise<boolean> {
    const permission = await prisma.profilePermission.findFirst({
      where: {
        accessProfileId,
        permission: {
          code: permissionCode,
        },
      },
      select: {
        id: true,
      },
    });

    return Boolean(permission);
  }

  async findPermissionCodesByProfileId(
    accessProfileId: string,
  ): Promise<string[]> {
    const permissions = await prisma.profilePermission.findMany({
      where: {
        accessProfileId,
      },
      select: {
        permission: {
          select: {
            code: true,
          },
        },
      },
    });

    return permissions.map((item) => item.permission.code);
  }
}
