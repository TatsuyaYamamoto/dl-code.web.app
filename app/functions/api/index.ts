import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { AppModule } from "./app.module";
import { INestApplication } from "@nestjs/common";

const expressInstance = express();
const expressAdapter = new ExpressAdapter(expressInstance);
let nestAppPromise: Promise<INestApplication> | null = null;

const createNestApp = async () => {
  const app = await NestFactory.create(AppModule, expressAdapter);
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
