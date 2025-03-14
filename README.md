# 婚礼助手 (Wedding Helper)

## 项目简介

婚礼助手是一个专为婚礼现场司仪设计的Web应用，帮助司仪有序地管理婚礼流程，提供台词提示、计时功能和背景音乐播放，让婚礼进行更加流畅和专业。

## 主要功能

- **婚礼流程管理**：预设多个婚礼环节，包括来宾入场、新人入场、证婚、交换戒指等
- **司仪台词提示**：每个环节配备专业的司仪台词，支持自定义修改
- **计时功能**：为每个环节设置倒计时，帮助司仪控制婚礼节奏
- **音乐播放**：支持为每个环节设置背景音乐，包括预设音乐和自定义上传
- **进度跟踪**：直观显示婚礼进行进度，方便掌控整体流程
- **自定义编辑**：支持添加、删除、调整环节顺序和内容
- **本地存储**：使用LocalStorage和IndexedDB保存设置和音乐文件，无需联网也能使用

## 技术栈

- **前端框架**：Next.js 15.2.2 (React 19)
- **UI组件**：自定义组件 + Lucide React 图标
- **样式**：Tailwind CSS 4
- **存储**：LocalStorage (流程数据) + IndexedDB (音乐文件)
- **部署**：支持Vercel部署或自托管服务器(PM2)

## 项目结构

```
wedding-helper/
├── app/                    # Next.js 应用目录
│   ├── components/         # React 组件
│   │   ├── editor/         # 编辑器相关组件
│   │   ├── music/          # 音乐播放相关组件
│   │   ├── ui/             # UI通用组件
│   │   ├── wedding/        # 婚礼流程相关组件
│   │   └── ...             # 其他组件
│   ├── lib/                # 工具函数和服务
│   │   ├── musicStorage.js # 音乐存储服务
│   │   └── ...             # 其他工具函数
│   ├── globals.css         # 全局样式
│   ├── layout.js           # 应用布局
│   └── page.js             # 主页面
├── public/                 # 静态资源
│   └── audio/              # 预设音乐文件
├── deploy.sh               # 部署脚本
├── ecosystem.config.js     # PM2配置
└── ...                     # 其他配置文件
```

## 组件结构
```
app/
└── components/
    ├── WeddingHelper.jsx (主组件，负责状态管理和组合其他组件)
    ├── wedding/
    │   ├── ProgramStep.jsx (单个婚礼环节的组件)
    │   ├── ProgramProgress.jsx (婚礼进度条)
    │   ├── StepsList.jsx (婚礼环节列表)
    │   ├── StepScript.jsx (司仪台词展示与编辑入口)
    │   ├── StepMusic.jsx (环节音乐展示与控制)
    │   └── ConfettiEffect.jsx (庆祝动画效果)
    ├── editor/
    │   ├── ProgramEditor.jsx (程序编辑器组件)
    │   ├── StepForm.jsx (环节编辑表单)
    │   └── StepItem.jsx (编辑模式下的环节项)
    ├── music/
    │   ├── MusicLibrary.jsx (音乐库管理组件)
    │   ├── UploadedMusic.jsx (上传的音乐列表)
    │   ├── PresetMusic.jsx (预设音乐列表) 
    │   └── MusicSelector.jsx (音乐选择器)
    └── ui/
        ├── Card.jsx (卡片UI组件)
        ├── Button.jsx (按钮组件)
        ├── Tabs.jsx (标签页组件)
        └── GradientText.jsx (渐变文字组件)
```

## 安装与运行

### 开发环境

1. 克隆仓库
```bash
git clone <https://github.com/Maolipeng/wedding-helper.git>
cd wedding-helper
```

2. 安装依赖
```bash
pnpm install
```

3. 启动开发服务器
```bash
pnpm dev
```

4. 在浏览器中访问 [http://localhost:3000](http://localhost:3000)

### 生产环境部署

#### 方法一：使用PM2部署到服务器

1. 在服务器上克隆仓库并安装依赖
```bash
git clone <仓库地址>
cd wedding-helper
pnpm install
```

2. 构建应用
```bash
pnpm build
```

3. 使用PM2启动应用
```bash
pm2 start ecosystem.config.js
```

4. 或使用部署脚本一键部署
```bash
./deploy.sh
```

#### 方法二：部署到Vercel

1. 将代码推送到GitHub仓库
2. 在Vercel上导入项目
3. 按照Vercel提示完成部署

## 使用指南

### 基本操作

1. **浏览婚礼流程**：主界面显示当前环节，包括环节名称、台词和计时器
2. **切换环节**：点击"下一环节"按钮进入下一个环节
3. **控制计时**：点击计时器旁的播放/暂停按钮控制倒计时
4. **播放音乐**：点击音乐控制区的播放按钮播放当前环节的背景音乐

### 自定义婚礼流程

1. 点击"自定义流程与音乐"按钮进入编辑模式
2. 在编辑界面可以：
   - 添加/删除环节
   - 修改环节名称、台词和时长
   - 上传自定义音乐或选择预设音乐
   - 调整环节顺序
3. 完成编辑后点击"保存并返回"按钮

### 音乐管理

1. 在编辑模式下，切换到"音乐库"标签
2. 选择"预设音乐"或"上传音乐"标签
3. 上传本地音乐文件或管理预设音乐
4. 为每个环节选择合适的背景音乐

### 设置

点击设置图标可以调整：
- 自动播放音乐：切换环节时是否自动播放背景音乐
- 自动开始计时：切换环节时是否自动开始倒计时

## 注意事项

- 上传的音乐文件存储在浏览器的IndexedDB中，清除浏览器数据会导致音乐丢失
- 婚礼流程数据保存在LocalStorage中，更换设备需要重新设置
- 预设音乐需要放在`public/audio/`目录下，并在音乐库中添加

## 贡献指南

欢迎提交Pull Request或Issue来改进这个项目。在提交代码前，请确保：

1. 代码风格符合项目规范
2. 新功能有适当的测试
3. 所有测试都能通过
4. 更新相关文档

## 许可证

本项目采用MIT许可证。详见LICENSE文件。

## 作者

毛立鹏

---

祝您的婚礼圆满成功！