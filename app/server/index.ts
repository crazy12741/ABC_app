import { createRequestHandler } from 'expo-server/adapter/workerd';

// `expo export -p web` writes the API + server code to dist/server.
export default createRequestHandler({ build: '../dist/server' });
