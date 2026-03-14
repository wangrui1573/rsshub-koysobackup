import type { Route } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/new',
    categories: ['game'],
    example: '/gamestatus/new',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '最新破解游戏',
    maintainers: ['lobster-bot'],
    handler,
};

async function handler() {
    const url = 'https://gamestatus.info/back/api/gameinfo/game/lastcrackedgames/?format=json';
    const data = await ofetch(url);

    const items = (data.list_crack_games || []).slice(0, 10).map((game: any) => ({
        title: game.title,
        link: `https://gamestatus.info/${game.slug}/en`,
        pubDate: game.crack_date ? new Date(game.crack_date).toUTCString() : undefined,
        description: game.readable_status || '',
        image: game.short_image,
    }));

    return {
        title: 'GameStatus 破解游戏',
        link: 'https://gamestatus.info',
        language: 'en',
        item: items,
    };
}
