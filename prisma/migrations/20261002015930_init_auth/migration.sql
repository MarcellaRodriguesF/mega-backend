-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "access_profile_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_profiles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "module" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_permissions" (
    "id" UUID NOT NULL,
    "access_profile_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_access_profile_id_idx" ON "users"("access_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_profiles_name_key" ON "access_profiles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "profile_permissions_permission_id_idx" ON "profile_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_permissions_access_profile_id_permission_id_key" ON "profile_permissions"("access_profile_id", "permission_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_access_profile_id_fkey" FOREIGN KEY ("access_profile_id") REFERENCES "access_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_permissions" ADD CONSTRAINT "profile_permissions_access_profile_id_fkey" FOREIGN KEY ("access_profile_id") REFERENCES "access_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_permissions" ADD CONSTRAINT "profile_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
