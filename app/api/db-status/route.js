import { NextResponse } from 'next/server';
import { checkDbStatus } from '../../lib/prismaDbService';

export async function GET() {
  try {
    const status = await checkDbStatus();
    
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('获取数据库状态失败:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        enabled: true,
        connected: false,
        message: '获取数据库状态失败', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}