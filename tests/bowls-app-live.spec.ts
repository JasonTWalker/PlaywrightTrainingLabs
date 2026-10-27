import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page'

// Lab2A
test.describe.skip("Bowls Club App Homepage ('/')", () => {
    test('Has title and heading', async ({ page }) => {
        // open bowls application at index (empty url '/')
        await page.goto('http://localhost:3000/');
        
        await test.step('Homepage has title "Club Management Platform', async () => {
            await expect(page).toHaveTitle("Club Management Platform")
        });

        await test.step('Homepage contains header with "Club Management Platform', async () => {
            await expect(page.getByRole("heading", { name : 'Club Management Platform'})).toBeVisible();
        });
    });
});


// Lab2B
let loginPage: LoginPage;
test.describe("Login Page Testing ('/auth/login')", () => {
    test("Login attempt with invalid user/password prevents entry", async ( {page}) => {
        // navigate to login page URL
        await page.goto('http://localhost:3000/auth/login')
        // initialise loginPage reference
        loginPage = new LoginPage(page);

        await loginPage.fillEmailFormField("test@mail.com");

        await loginPage.fillPasswordFormField("lol123");

        await loginPage.clickSubmitLogin();

        // assert on error message
        await expect(loginPage.invalidLoginCredentialsMessage).toBeVisible();
    })

    test("Login with valid user details signs in", async ( { page }) => {
        // navigate to login page URL
        await page.goto('http://localhost:3000/auth/login')
        // initialise loginPage reference
        loginPage = new LoginPage(page);

        // user details taken fom prisma/seed.ts in current iteration (v1.0.2)
        await loginPage.fillEmailFormField("user@lakeview.club");

        await loginPage.fillPasswordFormField("user123");

        await loginPage.clickSubmitLogin();

        // assert on error message
        // no longer using loginPage as should now be bypassed
        // not sure that i like this locator
        await expect(page.getByText("Sign Out")).toBeVisible();
    })
})
