import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page'
import pages from './utils/pages'
import uiPages from './utils/uiPages';

// retrieve login details from .env, keeps these private from github and globally accessible if change needed
const userEmail = process.env.USEREMAIL;
const userPassword = process.env.USERPASSWORD;
let loginPage: LoginPage;

if (!userEmail || !userPassword) {
    throw new Error('Set USEREMAIL and USERPASSWORD in the project .env file.');
}

test.use( { storageState: { cookies: [], origins: [] }});   //reset storage state ?
test.describe.configure( { mode: 'serial'}) // as parallel causes issues

test.beforeEach( async ({page}) => {
    // await page.goto(pages.loginPage) // navigates to the defined EXTENSION of BASEURL
    await page.goto(uiPages.loginPage)
    loginPage = new LoginPage(page) //defines current page as LoginPage object to EXTEND methods
}
)

test.describe("Login Page Testing ('/auth/login')", () => {
    test("Login attempt with invalid user/password prevents entry", async ( {page}) => {
        // call doLogin function with incorrect password
        await loginPage.doLogin(userEmail, "invalid password")

        // assert on error message
        await loginPage.checkInvalidCredentials();
    })

    test("Login with valid user details signs in", async ( { page }) => {
        // navigate to login page URL
        await page.goto('http://localhost:3000/auth/login')
        // initialise loginPage reference
        await loginPage.doLogin(userEmail, userPassword);

        // call loginPage checkLoggedIn, calles page.WaitForUrl to give time for redirect
        await loginPage.checkLoggedIn()
    })
});
