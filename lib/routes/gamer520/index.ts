import { load } from 'cheerio';

import type { Route } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/:category?',
    categories: ['game'],
    example: '/gamer520/latest',
    parameters: {
        category: {
            description: '分类',
            options: [
                {
                    label: '首页最新',
                    value: 'latest',
                },
                {
                    label: 'PC游戏',
                    value: 'pcplay',
                },
                {
                    label: 'Switch游戏',
                    value: 'switch',
                },
                {
                    label: 'PC修改器',
                    value: 'xgq',
                },
                {
                    label: '3A巨作',
                    value: '3a',
                },
                {
                    label: '金手指',
                    value: 'jinshouzhi',
                },
                {
                    label: 'Switch主题',
                    value: 'zhuti',
                },
                {
                    label: '模拟器大全',
                    value: 'zhangji',
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
            source: ['gamer520.com/'],
            target: '/latest',
        },
        {
            source: ['gamer520.com/pcplay'],
            target: '/pcplay',
        },
        {
            source: ['gamer520.com/gameswitch'],
            target: '/switch',
        },
        {
            source: ['gamer520.com/xgq'],
            target: '/xgq',
        },
        {
            source: ['gamer520.com/3ajuzuo'],
            target: '/3a',
        },
        {
            source: ['gamer520.com/jinshouzhi'],
            target: '/jinshouzhi',
        },
        {
            source: ['gamer520.com/zhuti'],
            target: '/zhuti',
        },
        {
            source: ['gamer520.com/zhangji'],
            target: '/zhangji',
        },
    ],
    name: 'Switch520-Gamer520',
    maintainers: ['lobster-bot'],
    handler,
};

const categoryMap: Record<string, { url: string; title: string; description: string }> = {
    latest: {
        url: 'https://www.gamer520.com/',
        title: 'Gamer520 - 最新资源',
        description: 'Switch520-Gamer520 最新游戏资源',
    },
    pcplay: {
        url: 'https://www.gamer520.com/pcplay',
        title: 'Gamer520 - PC游戏',
        description: 'PC游戏资源 - Gamer520',
    },
    switch: {
        url: 'https://www.gamer520.com/gameswitch',
        title: 'Gamer520 - Switch游戏',
        description: 'Switch游戏资源 - Gamer520',
    },
    xgq: {
        url: 'https://www.gamer520.com/xgq',
        title: 'Gamer520 - PC修改器',
        description: 'PC修改器资源 - Gamer520',
    },
    '3a': {
        url: 'https://www.gamer520.com/3ajuzuo',
        title: 'Gamer520 - 3A巨作',
        description: '3A巨作资源 - Gamer520',
    },
    jinshouzhi: {
        url: 'https://www.gamer520.com/jinshouzhi',
        title: 'Gamer520 - 金手指',
        description: 'Switch金手指资源 - Gamer520',
    },
    zhuti: {
        url: 'https://www.gamer520.com/zhuti',
        title: 'Gamer520 - Switch主题',
        description: 'Switch主题资源 - Gamer520',
    },
    zhangji: {
        url: 'https://www.gamer520.com/zhangji',
        title: 'Gamer520 - 模拟器大全',
        description: '模拟器资源 - Gamer520',
    },
};

async function handler(ctx: any) {
    const category = ctx.req.param('category') || 'latest';
    const config = categoryMap[category] || categoryMap.latest;

    const html = await ofetch(config.url, {
        parseResponse: (text) => text,
    });

    const $ = load(html as string);
    const items: any[] = [];

    $('article').each((_, element) => {
        const $el = $(element);
        const $h2 = $el.find('h2').first();
        const $link = $h2.find('a').first();

        const title = $link.attr('title') || $link.text().trim();
        const link = $link.attr('href');

        // 封面图片（懒加载，取 data-src）
        const $img = $el.find('img.lazyload').first();
        const coverUrl = $img.attr('data-src') || $img.attr('src') || '';

        // 发布时间
        const $time = $el.find('time').first();
        const pubDate = $time.attr('datetime') ? new Date($time.attr('datetime')!).toUTCString() : undefined;

        // 摘要描述
        const $excerpt = $el.find('.entry-excerpt').first();
        const description = $excerpt.text().trim();

        if (title && link) {
            const safeTitle = title.replaceAll('"', '&quot;');
            let descHtml = '';
            if (coverUrl) {
                descHtml += `<img src="${coverUrl}" alt="${safeTitle}" style="max-width:300px"/><br/>`;
            }
            if (description) {
                descHtml += `<p>${description}</p>`;
            }

            items.push({
                title,
                link,
                guid: link,
                pubDate,
                description: descHtml || undefined,
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
