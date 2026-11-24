import { createRequestHandler } from 'expo-server/adapter/workerd';

const handler = createRequestHandler({ build: '../dist/server' });

export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        return handler(request, env, ctx);
    },
};

