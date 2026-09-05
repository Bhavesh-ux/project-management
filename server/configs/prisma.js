import 'dotenv/config'
import { PrismaClient } from '@prisma/client';
import { PrismaNeno } from '@prisma/adapter-neon';
import {nenoConfig} from '@neondatabase/serverless';

import ws from 'ws';
nenoConfig.webSocketConstructor = ws;


const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaNeno({ connectionString})
const prisma = global.prisma || new PrismaClient({ adapter });

if(process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma