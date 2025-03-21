import { NextResponse } from 'next/server';
import * as dbService from '../../lib/prismaDbService';

export async function POST(request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { action, data } = body;
    
    let result;
    
    // 根据不同操作执行不同功能
    switch (action) {
      case 'syncSettings':
        result = await dbService.syncSettings(data);
        break;
        
      case 'syncProgram':
        result = await dbService.syncWeddingProgram(data);
        break;
        
      case 'syncPresets':
        result = await dbService.syncPresetMusic(data);
        break;
        
      case 'syncTrim':
        if (!data || !data.musicId) {
          throw new Error('缺少必要的参数');
        }
        result = await dbService.syncTrimSettings(
          data.musicId, 
          data.settings, 
          data.isPreset || false
        );
        break;
        
      case 'fetchSettings':
        result = await dbService.fetchSettings();
        break;
        
      case 'fetchProgram':
        result = await dbService.fetchWeddingProgram();
        break;
        
      case 'fetchPresets':
        result = await dbService.fetchPresetMusic();
        break;
        
      case 'fetchTrimSettings':
        result = await dbService.fetchTrimSettings();
        break;
        
      case 'clearData':
        result = await dbService.clearUserData();
        break;
        
      default:
        throw new Error('未知的操作类型');
    }
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('同步操作失败:', error);
    
    return NextResponse.json(
      { success: false, message: '同步操作失败', error: error.message },
      { status: 500 }
    );
  }
}