use dotenv::dotenv;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use std::env;
use tauri::command;

#[derive(Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct DeepSeekRequest {
    messages: Vec<Message>,
    model: String,
    temperature: f32,
    max_tokens: i32,
}

#[derive(Deserialize)]
struct Choice {
    message: Message,
}

#[derive(Deserialize)]
struct DeepSeekResponse {
    choices: Vec<Choice>,
}

#[command]
async fn generate_script(prompt: String) -> Result<String, String> {
    dotenv().ok(); // 加载 .env 文件

    // 从环境变量获取 API 密钥
    let api_key = env::var("DEEPSEEK_API_KEY").map_err(|_| {
        "未配置 DeepSeek API 密钥，请在 .env 文件中设置 DEEPSEEK_API_KEY".to_string()
    })?;

    // 准备请求头
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {}", api_key))
            .map_err(|e| format!("无效的 API 密钥格式: {}", e))?,
    );

    // 准备消息
    let messages = vec![
        Message {
            role: "system".to_string(),
            content:
                "你是一位专业的婚礼司仪文案撰写专家，擅长写出优美、感人且适合中国传统婚礼的台词。"
                    .to_string(),
        },
        Message {
            role: "user".to_string(),
            content: prompt,
        },
    ];

    // 准备请求体
    let request_body = DeepSeekRequest {
        messages,
        model: "deepseek-chat".to_string(),
        temperature: 0.7,
        max_tokens: 1000,
    };

    // 创建客户端并发送请求
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.deepseek.com/v1/chat/completions")
        .headers(headers)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("DeepSeek API 调用失败: {}", e))?;

    // 处理响应
    if response.status().is_success() {
        let deepseek_response: DeepSeekResponse = response
            .json()
            .await
            .map_err(|e| format!("解析 API 响应失败: {}", e))?;

        if let Some(choice) = deepseek_response.choices.get(0) {
            return Ok(choice.message.content.clone());
        } else {
            return Err("API 返回的响应中未包含任何生成内容".to_string());
        }
    } else {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法获取错误信息".to_string());

        return Err(format!(
            "API 请求失败，状态码: {}，错误: {}",
            status, error_text
        ));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_script])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
