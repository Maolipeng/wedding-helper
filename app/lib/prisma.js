import { PrismaClient } from '@prisma/client'

// 使用单例模式防止热重载时创建多个实例
let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export default prisma