import OpenAI from "openai";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { prompt } = body;
    
    // 从环境变量获取API密钥
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: '未配置 DeepSeek API 密钥，请在环境变量中设置 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }
    
    // 初始化 DeepSeek API 客户端
    const openai = new OpenAI({ 
      baseURL: 'https://api.deepseek.com', 
      apiKey: apiKey 
    });
    
    // 调用 DeepSeek API
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "你是一位专业的婚礼司仪文案撰写专家，擅长写出优美、感人且适合中国传统婚礼的台词。" 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // 返回生成的内容
    return NextResponse.json({ 
      content: completion.choices[0].message.content 
    });
    
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error);
    
    return NextResponse.json(
      { error: `AI 生成失败: ${error.message}` },
      { status: 500 }
    );
  }
}