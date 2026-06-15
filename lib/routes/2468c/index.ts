import { load } from 'cheerio';
import type { Route } from '@/types';
import puppeteer from '@/utils/puppeteer';

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
        requirePuppeteer: true,
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
    const category = ctx.params.category || 'latest';
    const config = categoryMap[category] || categoryMap.latest;

    // 2468c.com 是 SPA 站点，有反爬保护（403），必须使用 puppeteer 渲染
    const browser = await puppeteer();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        request.resourceType() === 'document' || request.resourceType() === 'script' || request.resourceType() === 'xhr' ? request.continue() : request.abort();
    });
    await page.goto(config.url, {
        waitUntil: 'domcontentloaded',
    });
    const response = await page.evaluate(() => document.documentElement.innerHTML);
    await browser.close();

    const $ = load(response);
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
                description: coverUrl
                    ? `<img src="${coverUrl}" alt="${title.replace(/"/g, '&quot;')}" style="max-width:300px"/>`
                    : '',
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
