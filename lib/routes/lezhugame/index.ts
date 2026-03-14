import { load } from 'cheerio';
import type { Route } from '@/types';
import got from '@/utils/got';

export const route: Route = {
    path: '/new',
    categories: ['game'],
    example: '/lezhugame/new',
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
    const url = 'https://www.lezhugame.com';
    const response = await got({ method: 'get', url });
    const $ = load(response.data);
    const items: any[] = [];

    const articles = $('.cat-posts-wrapper .post').slice(0, 10);
    for (const element of articles.toArray()) {
        const $article = $(element);
        const title = $article.find('.entry-title a').text();
        const link = $article.find('.entry-title a').attr('href');
        const pubDate = $article.find('.entry-date').attr('datetime');

        if (title && link) {
            items.push({
                title,
                link,
                pubDate: pubDate ? new Date(pubDate).toUTCString() : undefined,
            });
        }
    }

    return {
        title: '乐猪游戏',
        link: url,
        language: 'zh-cn',
        item: items,
    };
}
