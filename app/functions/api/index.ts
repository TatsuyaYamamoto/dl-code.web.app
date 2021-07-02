import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { AppModule } from "./app.module";

const expressInstance = express();
const expressAdapter = new ExpressAdapter(expressInstance);
let nestAppPromise: Promise<INestApplication> | null = null;

const createNestApp = async () => {
  const app = await NestFactory.create(AppModule, expressAdapter);
  app.useGlobalPipes(new ValidationPipe());
  app.use(helmet());
  app.use(morgan("combined"));
  app.enableCors();
  await app.init();
  return app;
};

export const getExpressInstance = async (): Promise<express.Express> => {
  if (!nestAppPromise) {
    nestAppPromise = createNestApp();
  }

  return nestAppPromise.then(() => expressInstance);
};
