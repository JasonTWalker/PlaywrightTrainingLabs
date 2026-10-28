import { chromium, FullConfig } from '@playwright/test';
import LoginPage from '../pages/login-page';
import uiPages from '../utils/uiPages';

async function globalSetup(config: FullConfig) {
    // fetch user details from .env
  const user = process.env.USEREMAIL!;
  const password = process.env.USERPASSWORD!;
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch({ headless: true, timeout: 10000 });
  const page = await browser.newPage();
  const loginPage = new LoginPage(page);

  await page.goto(baseURL+uiPages.loginPage);
  await loginPage.doLogin(user, password);
  await loginPage.checkLoggedIn();
  await page.context().storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;