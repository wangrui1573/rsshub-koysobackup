import { load } from 'cheerio';
import type { Route } from '@/types';
import got from '@/utils/got';

export const route: Route = {
    path: '/new',
    categories: ['game'],
    example: '/vgter/new',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '最新文章',
    maintainers: ['lobster-bot'],
    handler,
};

async function handler() {
    const url = 'https://www.vgter.net';
    const response = await got({ method: 'get', url });
    const $ = load(response.data);
    const items: any[] = [];

    const articles = $('.post');
    for (const element of articles.toArray().slice(0, 10)) {
        const $article = $(element);
        const title = $article.find('.post-title a').text();
        const link = $article.find('.post-title a').attr('href');
        const pubDate = $article.find('.post-date').attr('datetime');

        if (title && link) {
            items.push({
                title,
                link,
                pubDate: pubDate ? new Date(pubDate).toUTCString() : undefined,
            });
        }
    }

    return {
        title: 'VGter 上游世界',
        link: url,
        language: 'zh-cn',
        item: items,
    };
}
