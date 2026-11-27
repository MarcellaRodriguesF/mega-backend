import { prisma } from "../../database/prisma.js";

export class AuthRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        accessProfile: true,
      },
    });
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        accessProfile: true,
      },
    });
  }

  updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}
