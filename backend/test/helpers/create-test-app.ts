import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { configureApp } from '@/config/app.setup';

export interface TestApp {
  app: NestExpressApplication;
  moduleRef: TestingModule;
}

type Customize = (builder: TestingModuleBuilder) => TestingModuleBuilder;

export const createTestApp = async (customize: Customize = (b) => b): Promise<TestApp> => {
  const moduleRef = await customize(Test.createTestingModule({ imports: [AppModule] })).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();

  configureApp(app);
  await app.init();

  return { app, moduleRef };
};
