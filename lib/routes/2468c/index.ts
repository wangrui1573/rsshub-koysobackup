import { load } from 'cheerio';

import type { Route } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/:category?',
    categories: ['game'],
    example: '/2468c/latest',
    parameters: {
        category: {
            description: '分类',
            options: [
                {
                    label: '首页最新',
                    value: 'latest',
                },
                {
                    label: 'PS5',
                    value: 'ps5',
                },
                {
                    label: 'PS5 含ffpfsc',
                    value: 'ps5-ffpfsc',
                },
                {
                    label: 'PS4',
                    value: 'ps4',
                },
            ],
            default: 'latest',
        },
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['2468c.com/'],
            target: '/latest',
        },
        {
            source: ['2468c.com/ps5game'],
            target: '/ps5',
        },
        {
            source: ['2468c.com/ps5game/ffpfsc'],
            target: '/ps5-ffpfsc',
        },
        {
            source: ['2468c.com/ps4'],
            target: '/ps4',
        },
    ],
    name: '奥德彪计划',
    maintainers: ['lobster-bot'],
    handler,
};

const categoryMap: Record<string, { url: string; title: string; description: string }> = {
    latest: {
        url: 'https://2468c.com/',
        title: '2468c 奥德彪计划 - 最新资源',
        description: 'PS4/PS5 游戏资源 - 奥德彪计划最新更新',
    },
    ps5: {
        url: 'https://2468c.com/ps5game',
        title: '2468c 奥德彪计划 - PS5 资源',
        description: 'PS5 游戏资源 - 奥德彪计划',
    },
    'ps5-ffpfsc': {
        url: 'https://2468c.com/ps5game/ffpfsc',
        title: '2468c 奥德彪计划 - PS5 含ffpfsc',
        description: 'PS5 游戏资源（含 ffpfsc）- 奥德彪计划',
    },
    ps4: {
        url: 'https://2468c.com/ps4',
        title: '2468c 奥德彪计划 - PS4 资源',
        description: 'PS4 游戏资源 - 奥德彪计划',
    },
};

async function handler(ctx: any) {
    const category = ctx.req.param('category') || 'latest';
    const config = categoryMap[category] || categoryMap.latest;

    // 2468c.com 有 JS 挑战防护：首次请求返回 403 + set-cookie，
    // 携带 cookie 再次请求才能获取真实 HTML 内容
    let cookieStr = '';

    try {
        await ofetch.raw(config.url, {
            onResponse({ response }) {
                const setCookieHeaders = response.headers.getSetCookie?.() || [];
                cookieStr = setCookieHeaders.map((c: string) => c.split(';')[0]).join('; ');
            },
            onError() {
                // 首次请求 403 是预期的，忽略错误
            },
        });
    } catch {
        // 首次请求失败是正常的（403 + JS 挑战）
    }

    // 携带 cookie 再次请求，获取真实页面
    const response = await ofetch(config.url, {
        headers: cookieStr ? { Cookie: cookieStr } : undefined,
        parseResponse: (text) => text,
    });

    const $ = load(response as string);
    const items: any[] = [];

    $('article').each((_, element) => {
        const $el = $(element);
        const $h2 = $el.find('h2').first();
        const $link = $h2.find('a').first();

        const title = $link.attr('title') || $link.text().trim();
        const link = $link.attr('href');

        // 封面图片
        const $img = $el.find('img').first();
        const coverUrl = $img.attr('data-src') || $img.attr('src') || '';

        // 发布时间
        const $time = $el.find('time').first();
        const pubDate = $time.attr('datetime') ? new Date($time.attr('datetime')!).toUTCString() : undefined;

        if (title && link) {
            items.push({
                title,
                link,
                guid: link,
                pubDate,
                description: coverUrl ? `<img src="${coverUrl}" alt="${title.replaceAll(/"/g, '&quot;')}" style="max-width:300px"/>` : '',
            });
        }
    });

    return {
        title: config.title,
        link: config.url,
        language: 'zh-CN',
        description: config.description,
        item: items.slice(0, 50),
    };
}
