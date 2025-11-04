import { app } from './src/app';
import serverless from 'serverless-http';

// Create a serverless lambda service
export const handler = serverless(app);