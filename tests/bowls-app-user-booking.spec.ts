import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page'

// // WARNING: this assumes rink is available, however due to using locally run server there is non-zero chance it becomes booked
// // during exploratory testing or otherwise
// // seeding with conistent test data is important
// test.describe("User booking journey", () => {
//     test("User can book an available rink", async ({ page }) => {
//         await test.step("Login with valid user details, is member of a club", async () => {
//             // navigate to login page URL
//             await page.goto('http://localhost:3000/auth/login')
//             // initialise loginPage reference
//             const loginPage = new LoginPage(page);

//             loginPage.loginAsSeededUser();

//             loginPage.checkLoggedIn();
//         });

//         await test.step("User can navigate to bookings page", async() => {
//             await page.getByText("Book Now").click();
//             await page.waitForURL(/bookings/)

//             // assert that there is a header "Bookings" indicating they have navigated 
//             // two headers with name Bookings however, one for page, one for side navbar, unsure what to do in this case, but asserting for 2 results passes
//             await expect(page.getByRole("heading", {name: "Bookings"})).toHaveCount(2);
//         });

//         await test.step("User clicks on an Open rink, popup with optional name field shown", async () => {
//             await page.getByRole('button', { name: "Book Rink 1 at 12:00"}).click();
//             await expect(page.getByRole("heading", {name: "Book Rink 1"})).toBeVisible();
//         });

//         await test.step("User clicks request booking and confirmation message displayed", async() => {
//             await page.getByRole('button', { name: "Request Booking"}).click();
//             await expect(page.getByText("Booking requested for you successfully!")).toBeVisible();
//         });

//         // ensure this step with the requested rink matches previous step
//         await test.step("User dashboard has request visible", async() => {
//             await page.getByRole("link", {name: 'Dashboard'}).click();
//             // assert on lakeview-bowls homepage
//             await page.waitForURL(/lakeview-bowls/)
//             await expect(page).toHaveURL(/lakeview-bowls/);

//             // as multiples of, assert there is at least one
//             await expect(page.getByText("Rink 1 @ 12:00").first()).toBeVisible();            
//         });
        

// })

// });;