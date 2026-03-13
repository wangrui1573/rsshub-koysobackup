import { load } from 'cheerio';
import type { Route } from '@/types';
import got from '@/utils/got';

export const route: Route = {
    path: '/latest',
    categories: ['game'],
    example: '/koysobackup/latest',
    parameters: {},
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
            source: ['koysobackup.com', 'koysobackup.com/?sort=latest'],
            target: '/latest',
        },
    ],
    name: 'Latest Games',
    maintainers: ['lobster-bot'],
    handler,
};

async function handler() {
    const url = 'https://koysobackup.com/?sort=latest';

    const response = await got({
        method: 'get',
        url,
    });

    const $ = load(response.data);
    const items: any[] = [];

    $('a.game_item').each((_, element) => {
        const $item = $(element);
        const href = $item.attr('href');
        const gameId = href?.match(/\/game\/(\d+)/)?.[1];
        
        // 优先从 game_info span 获取标题（可能是中文），否则用 img alt
        let title = $item.find('.game_info span').text().trim() || $item.find('img').attr('alt');

        if (gameId && title) {
            items.push({
                title: title
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&'),
                link: `https://koysobackup.com/game/${gameId}`,
                guid: `https://koysobackup.com/game/${gameId}`,
                description: `Game ID: ${gameId}`,
            });
        }
    });

    return {
        title: 'KOYSO Backup - Latest Games',
        link: url,
        language: 'en',
        description: 'Free pre-installed PC games - Latest updates from koysobackup.com',
        item: items.slice(0, 50),
    };
}
