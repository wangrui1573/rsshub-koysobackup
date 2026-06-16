import type { Route } from '@/types';
import { PRESETS } from '@/utils/header-generator';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

const BASE_URL = 'https://www.cagames.top';

const categoryMap: Record<string, { id: number; name: string }> = {
    all: { id: 0, name: '全部游戏' },
    '2': { id: 2, name: '互动游戏' },
    '3': { id: 3, name: '单机游戏' },
    '4': { id: 4, name: 'galgame' },
    '5': { id: 5, name: '手机游戏' },
};

export const route: Route = {
    path: '/:category?',
    categories: ['game'],
    example: '/cagames',
    parameters: {
        category: {
            description: '分类 ID,默认 all 全部,可选: 2=互动游戏, 3=单机游戏, 4=galgame, 5=手机游戏',
            default: 'all',
            options: [
                { value: 'all', label: '全部游戏' },
                { value: '2', label: '互动游戏' },
                { value: '3', label: '单机游戏' },
                { value: '4', label: 'galgame' },
                { value: '5', label: '手机游戏' },
            ],
        },
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: true,
        supportBT: false,
        supportPodcast: false,
        supportSciHub: false,
    },
    name: 'CAGames 最新游戏',
    maintainers: ['lobster-bot'],
    handler,
    description: `CAGames (www.cagames.top) 是一个游戏资源分享站点,本路由通过其公开 API 提供最新游戏的 RSS 订阅。

支持的分类:
- all: 全部游戏 (默认)
- 2: 互动游戏
- 3: 单机游戏
- 4: galgame
- 5: 手机游戏

示例: /cagames (全部), /cagames/4 (galgame), /cagames/3 (单机游戏)`,
};

async function handler(ctx: any) {
    const category = ctx.req.param('category') || 'all';
    const cat = categoryMap[category] || categoryMap.all;

    const apiUrl = cat.id > 0 ? `${BASE_URL}/api/games?category_id=${cat.id}&sort=created_at&page=1&limit=30` : `${BASE_URL}/api/games?sort=created_at&page=1&limit=30`;

    // headerGeneratorOptions 让 ofetch 模拟真实浏览器请求头 (User-Agent/Accept/Sec-* 等)
    // 无此配置时 ofetch 默认 UA 为 node-fetch,会被 Cloudflare WAF 拦截返回 403
    const response = await ofetch<{ data: any[]; meta: { total: string; page: number; limit: number } }>(apiUrl, {
        headers: {
            Accept: 'application/json',
        },
        headerGeneratorOptions: PRESETS.MODERN_WINDOWS_CHROME,
    });

    const items = (response.data || []).map((g: any) => {
        const link = `${BASE_URL}/games/${g.slug}`;
        const cover = g.cover_image ? `${BASE_URL}${g.cover_image}` : '';
        const description = [cover && `<img src="${cover}" />`, g.description].filter(Boolean).join('<br/>');

        return {
            title: g.title,
            link,
            guid: `${BASE_URL}/games/${g.slug}#${g.id}`,
            pubDate: parseDate(g.created_at),
            description,
            category: g.tags ? g.tags.split(',').map((t: string) => t.trim()) : g.category_name ? [g.category_name] : undefined,
            author: g.category_name,
        };
    });

    return {
        title: `CAGames - ${cat.name}`,
        link: `${BASE_URL}/games?sort=created_at${cat.id > 0 ? `&category_id=${cat.id}` : ''}`,
        description: `CAGames (www.cagames.top) - ${cat.name} 最新资源`,
        item: items,
    };
}
