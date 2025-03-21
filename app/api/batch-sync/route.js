import { NextResponse } from 'next/server';
import * as dbService from '../../lib/prismaDbService';

export async function POST(request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { program, settings, presetMusic, trimSettings } = body;
    
    const results = {
      program: false,
      settings: false,
      presetMusic: false,
      trimSettings: 0
    };
    
    // 使用Promise.all并行处理多个同步任务
    await Promise.all([
      // 同步婚礼程序
      program ? (async () => {
        try {
          results.program = await dbService.syncWeddingProgram(program);
        } catch (error) {
          console.error('同步婚礼程序失败:', error);
        }
      })() : Promise.resolve(),
      
      // 同步设置
      settings ? (async () => {
        try {
          results.settings = await dbService.syncSettings(settings);
        } catch (error) {
          console.error('同步设置失败:', error);
        }
      })() : Promise.resolve(),
      
      // 同步预设音乐
      presetMusic ? (async () => {
        try {
          results.presetMusic = await dbService.syncPresetMusic(presetMusic);
        } catch (error) {
          console.error('同步预设音乐失败:', error);
        }
      })() : Promise.resolve(),
    ]);
    
    // 同步裁剪设置（这个需要串行处理）
    if (trimSettings && Array.isArray(trimSettings)) {
      let successCount = 0;
      for (const setting of trimSettings) {
        try {
          if (setting.musicId) {
            const isPreset = setting.isPreset || false;
            await dbService.syncTrimSettings(
              setting.musicId,
              { start: setting.start, end: setting.end },
              isPreset
            );
            successCount++;
          }
        } catch (error) {
          console.error(`同步裁剪设置失败 (${setting.musicId}):`, error);
        }
      }
      results.trimSettings = successCount;
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('批量同步操作失败:', error);
    
    return NextResponse.json(
      { success: false, message: '批量同步操作失败', error: error.message },
      { status: 500 }
    );
  }
}