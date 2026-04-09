import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  const port = Number(process.env.PORT || 4000);
  await app.listen(port, "0.0.0.0");
};

void bootstrap();
