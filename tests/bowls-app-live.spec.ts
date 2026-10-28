import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page'

// // failures due to user already being logged in, different dashboard on index
// test.afterEach("Click sign out if button present", async ({ page }) => {
//     const signOutButton = page.getByRole('button', { name: "Sign Out"});
//     if (await signOutButton.isVisible().catch(() => false)) {
//         await signOutButton.click();
//     }
// })


// // failures due to user already being logged in, different dashboard on index
// test.beforeEach("Navigate to dashboard, this is where a signout button is visible", async ({ page }) => {
//     await page.goto("http://localhost:3000/dashboard"); //for signed in user, this redirects to /lakeview-bowls/ where a sign out button is present
//     const signOutButton = page.getByRole('button', { name: "Sign Out"});
//     if (await signOutButton.isVisible().catch(() => false)) {
//         await signOutButton.click();
//   }
// })

// Lab2A
test.describe("Bowls Club App Homepage ('/')", () => {
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



test.describe("Login Page Testing ('/auth/login')", () => {
    test("Login attempt with invalid user/password prevents entry", async ( {page}) => {
        // navigate to login page URL
        await page.goto('http://localhost:3000/auth/login')
        // initialise loginPage reference
        const loginPage = new LoginPage(page);

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
        const loginPage = new LoginPage(page);

        // user details taken fom prisma/seed.ts in current iteration (v1.0.2)
        await loginPage.fillEmailFormField("user@lakeview.club");

        await loginPage.fillPasswordFormField("user123");

        await loginPage.clickSubmitLogin();

        // call loginPage checkLoggedIn, calles page.WaitForUrl to give time for redirect
        await loginPage.checkLoggedIn()
    })
});

// WARNING: this assumes rink is available, however due to using locally run server there is non-zero chance it becomes booked
// during exploratory testing or otherwise
// seeding with conistent test data is important
test.describe("User booking journey", () => {
    test("User can book an available rink", async ({ page }) => {
        await test.step("Login with valid user details, is member of a club", async () => {
            // navigate to login page URL
            await page.goto('http://localhost:3000/auth/login')
            // initialise loginPage reference
            const loginPage = new LoginPage(page);

            loginPage.loginAsSeededUser();

            loginPage.checkLoggedIn();
        });

        await test.step("User can navigate to bookings page", async() => {
            await page.getByText("Book Now").click();
            await page.waitForURL(/bookings/)

            // assert that there is a header "Bookings" indicating they have navigated 
            // two headers with name Bookings however, one for page, one for side navbar, unsure what to do in this case, but asserting for 2 results passes
            await expect(page.getByRole("heading", {name: "Bookings"})).toHaveCount(2);
        });

        await test.step("User clicks on an Open rink, popup with optional name field shown", async () => {
            await page.getByRole('button', { name: "Book Rink 1 at 12:00"}).click();
            await expect(page.getByRole("heading", {name: "Book Rink 1"})).toBeVisible();
        });

        await test.step("User clicks request booking and confirmation message displayed", async() => {
            await page.getByRole('button', { name: "Request Booking"}).click();
            await expect(page.getByText("Booking requested for you successfully!")).toBeVisible();
        });

        // ensure this step with the requested rink matches previous step
        await test.step("User dashboard has request visible", async() => {
            await page.getByRole("link", {name: 'Dashboard'}).click();
            // assert on lakeview-bowls homepage
            await page.waitForURL(/lakeview-bowls/)
            await expect(page).toHaveURL(/lakeview-bowls/);

            // as multiples of, assert there is at least one
            await expect(page.getByText("Rink 1 @ 12:00").first()).toBeVisible();            
        });
        

})

});;
