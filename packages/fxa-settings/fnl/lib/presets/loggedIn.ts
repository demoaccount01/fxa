import {
  newTestType,
  PlaywrightEnv,
  PlaywrightOptions,
  TestInfo,
} from '@playwright/test';
import { EnvName, create as creatEnv } from '../env';
import { BaseEnv, Credentials } from '../env/base';
import { EmailClient } from '../env/email';
import * as poms from '../pages';

export class LoggedInEnv extends PlaywrightEnv {
  private readonly env: BaseEnv;
  private credentials: Credentials;

  constructor(envName: EnvName, options?: PlaywrightOptions) {
    super('firefox', options);
    this.env = creatEnv(envName);
  }
  async beforeAll() {
    await super.beforeAll();
  }

  async beforeEach(testInfo: TestInfo) {
    const result = await super.beforeEach(testInfo);
    const email = EmailClient.emailFromTestTitle(testInfo.title);
    const password = 'asdzxcasd';
    await this.env.email.clear(email);
    this.credentials = await this.env.createAccount(email, password);

    const pages = poms.create(result.page, this.env);
    await pages.login.goto();
    await pages.login.useCredentials(this.credentials);
    // page.on('console',
    //   async msg => {
    //     for (let i = 0; i < msg.args().length; ++i)
    //       console.log(`${i}: ${await msg.args()[i].jsonValue()}`);
    //   })
    return {
      env: this.env,
      credentials: this.credentials,
      poms: pages,
      ...result,
    };
  }

  async afterEach(testInfo: TestInfo) {
    await super.afterEach(testInfo);
    await this.env.email.clear(this.credentials.email);
    await this.env.auth.accountDestroy(
      this.credentials.email,
      this.credentials.password
    );
  }

  async afterAll() {
    await super.afterAll();
    // await this.auth.accountDestroy(email, password)
  }
}

export const test = newTestType<{
  env: BaseEnv;
  credentials: Credentials;
  poms: ReturnType<typeof poms['create']>;
}>();
