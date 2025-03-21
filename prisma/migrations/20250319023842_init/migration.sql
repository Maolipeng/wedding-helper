-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_programs" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_steps" (
    "id" SERIAL NOT NULL,
    "step_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "script" TEXT,
    "music" TEXT,
    "music_source" TEXT,
    "music_name" TEXT,
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "program_id" INTEGER NOT NULL,

    CONSTRAINT "wedding_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_trim_settings" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "music_id" TEXT NOT NULL,
    "start_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "end_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_trim_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_music" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "music_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preset_music_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_programs_user_id_name_key" ON "wedding_programs"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_steps_program_id_step_id_key" ON "wedding_steps"("program_id", "step_id");

-- CreateIndex
CREATE UNIQUE INDEX "music_trim_settings_user_id_music_id_key" ON "music_trim_settings"("user_id", "music_id");

-- CreateIndex
CREATE UNIQUE INDEX "preset_music_user_id_music_id_key" ON "preset_music"("user_id", "music_id");

-- AddForeignKey
ALTER TABLE "wedding_steps" ADD CONSTRAINT "wedding_steps_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "wedding_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
