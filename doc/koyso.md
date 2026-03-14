# KOYSO Backup RSS 路由开发文档

## 项目概述

为 koysobackup.com 游戏下载网站开发 RSS 订阅功能，使其支持 RSS 阅读器订阅最新游戏更新。

- **GitHub**: https://github.com/wangrui1573/rsshub-koysobackup
- **RSS 订阅**: https://rsshub-koysobackup.vercel.app/koysobackup/latest

---

## 开发过程

### 1. 克隆 RSSHub 项目

```bash
git clone https://github.com/DIYgod/RSSHub.git rsshub-koysobackup
```

RSSHub 是一个开源的 RSS 生成工具，支持自定义路由开发。

### 2. 安装依赖

RSSHub 使用 pnpm 作为包管理器：

```bash
pnpm install
```

> 注意：如果遇到依赖冲突，可使用 `--legacy-peer-deps` 参数。

### 3. 开发路由

在 `lib/routes/koysobackup/` 目录下创建两个文件：

#### namespace.ts

```typescript
export default {
    name: 'KOYSO Backup',
    url: 'koysobackup.com',
};
```

#### index.ts

```typescript
import { load } from 'cheerio';
import type { Route } from '@/types';
import got from '@/utils/got';

export const route: Route = {
    path: '/latest',
    categories: ['game'],
    example: '/koysobackup/latest',
    // ... 配置
    handler,
};

async function handler() {
    // 使用 l=schinese 参数获取中文标题
    const url = 'https://koysobackup.com/?sort=latest&l=schinese';
    const response = await got({ method: 'get', url });
    const $ = load(response.data);
    const items: any[] = [];

    $('a.game_item').each((_, element) => {
        const $item = $(element);
        const href = $item.attr('href');
        const gameId = href?.match(/\/game\/(\d+)/)?.[1];
        let title = $item.find('.game_info span').text().trim() || $item.find('img').attr('alt');

        if (gameId && title) {
            items.push({
                title,
                link: `https://koysobackup.com/game/${gameId}`,
                guid: `https://koysobackup.com/game/${gameId}`,
            });
        }
    });

    return {
        title: 'KOYSO Backup - Latest Games',
        link: url,
        item: items.slice(0, 50),
    };
}
```

### 4. 本地测试

```bash
pnpm dev
curl http://localhost:1200/koysobackup/latest
```

### 5. 部署到 Vercel

```bash
npx vercel --token <YOUR_TOKEN> --prod --yes
```

---

## 遇到的问题与解决方案

### 问题 1：标题显示英文

**现象**：RSS 输出的游戏标题是英文（如 `Long Yin Li Zhi Zhuan`），而不是中文（如 `龙胤立志传`）。

**原因分析**：

1. **最初假设**：网站根据 `Accept-Language` 请求头返回不同语言
2. **实际原因**：网站使用 URL 参数 `l=schinese` 控制语言

**解决过程**：

1. 尝试添加 `Accept-Language: zh-CN` 请求头 → 无效
2. 检查网站 HTML 结构，发现 `.game_info span` 也显示英文
3. 测试 URL 参数 `?l=schinese` → 成功获取中文标题

**最终解决方案**：

修改请求 URL，添加语言参数：

```typescript
// 修改前
const url = 'https://koysobackup.com/?sort=latest';

// 修改后
const url = 'https://koysobackup.com/?sort=latest&l=schinese';
```

### 问题 2：GitHub Workflow 权限

**现象**：推送代码时报错 `refusing to allow an OAuth App to create or update workflow`

**原因**：GitHub OAuth Token 没有 workflow 权限

**解决方案**：删除 `.github/workflows/` 目录后重新推送

### 问题 3：Git 历史包含上游仓库

**现象**：克隆的仓库包含 RSSHub 官方仓库的 Git 历史

**解决方案**：删除 `.git` 目录，重新初始化仓库

```bash
rm -rf .git
git init
git add -A
git commit -m "Initial commit"
git remote add origin https://github.com/wangrui1573/rsshub-koysobackup.git
git push -f origin main
```

---

## 技术要点

### RSSHub 路由开发规范

1. **目录结构**：`lib/routes/<namespace>/index.ts`
2. **必须文件**：`namespace.ts` 和路由文件
3. **路由配置**：使用 `export const route: Route` 导出路由元数据
4. **数据获取**：使用 `got` 或 `ofetch` 进行 HTTP 请求
5. **HTML 解析**：使用 `cheerio` 库的 `load` 函数

### 调试技巧

1. 使用 `curl` 直接测试 URL 参数效果
2. 本地运行 `pnpm dev` 后用浏览器或 curl 测试 RSS 输出
3. 使用 `grep` 快速定位 HTML 元素内容

---

## 参考资料

- [RSSHub 官方文档](https://docs.rsshub.app)
- [RSSHub 路由开发指南](https://docs.rsshub.app/joinus/quick-start)
- [Cheerio 文档](https://cheerio.js.org)

---

## 更新记录

| 日期 | 内容 |
|------|------|
| 2026-03-14 | 创建路由，添加语言参数支持中文标题 |
