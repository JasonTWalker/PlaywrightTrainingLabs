# Playwright Training Labs
Public repository to show journey of learning automation testing with Playwright framework. Testing conducted on proprietary Bowls application which requires access.
Base URL for testing set to 'localhost:3000', assumption that localhost server is active before test suite is ran. 

<hr>


### Test Suite Syntax
Within a test suite tests typically have a title, followed by the expectation. 
</br> </br>
test('has title', async ({ page }) => { </br>
&emsp;  await page.goto('localhost:3000/'); </br>
&emsp;  await expect(page).toHaveTitle(/Club Management Platform/); </br>
});

#### Test Annotations 
Individual Test Structure: 


However, you can modify the format of the above to adjust your test cases:
- test.describe("group of tests") => test('test one'...
- test.skip('doesnt run') => ...
- test.fail('this'll run and fail') => ...
- test.fixme('this won't run and will fail') => ...
- test.slow('this test is slow, so timeout has been extended') => ...

These annotations can be applied to standalone or grouped tests.
<hr>

### Locators
Locators are how Playwright knows where to click, or where to check if such element is present. It transforms code into a reference to HTML elements on page (simplified). 
However, if there are elements that are repeatedly accessed then finding them every time results in a lot of code duplication, and what if the name of the button changes? All those references have to be updated.
Instead, we can define a class for our elements within the testing suite, with a variable matching the locator. In this case only the class needs to be updated. Can also modify the assertations in here. 

<details>
 <summary> Click to view example LoginPage class </summary>


```
export class LoginPage {

    readonly page:Page;
    // the actual button that submits the form of login details.
    // in the current iteration it has text "Sign In"
    readonly submitSignInButton: Locator; 
    readonly emailFormField: Locator;
    readonly passwordFormField: Locator;

    // should probably use a better locator than text, but this is justified
    readonly invalidLoginCredentialsMessage: Locator;


    // HTML warning that a form field should have an ID or name attribute for ease of finding in testing/accessibility
    constructor (page: Page) {
        this.page = page;
        this.submitSignInButton = page.getByRole('button', { name: ' Sign In'})
        this.emailFormField = page.getByPlaceholder("Email")
        this.passwordFormField = page.getByPlaceholder("Password")

        // verbose variable name, but worth noting the CREDENTIALS are invalid - NOT the inputs !
        this.invalidLoginCredentialsMessage = page.getByText("Invalid email or password");
    }

    async clickSubmitLogin() {
        await this.submitSignInButton.click();
    }

    async fillEmailFormField( text: string ) {
        await this.emailFormField.fill(text);
    }

    async fillPasswordFormField( text: string ) {
        await this.passwordFormField.fill(text);
    }
    // login as member of Lakeview-Bowls club
    async loginAsSeededUser() {
        await this.fillEmailFormField("user@lakeview.club");
        await this.fillPasswordFormField("user123")
        await this.clickSubmitLogin();
    }
}
export default LoginPage;
```
</details>

The justification for moving the LoginPage into a POM is that it is a requirement for many tests. Without a way currently to ensure a 'logged-in' state for each test, most functionality tests will need the test to sign in. This removes duplicate code, allowing for sign-in to be executed through a method call - in this case loginAsSeededUser().

### TearDown
TearDown is incredibly important, and it helps to have each test case return to a controllable, isolated state from which UI flow is easy to predict and write test cases for. In this project, I added conditional teardowns to beforeEach (test) and afterEach (test). The goal of this logic is to sign-out the user if a user is signed in at the start or end of each test - this is because pages look different based on the user type and if the user is signed in.

<details>
<summary>Show example teardown: </summary>

 ```
 // failures due to user already being logged in, different dashboard on index
test.afterEach("Click sign out if button present", async ({ page }) => {
    const signOutButton = page.getByRole('button', { name: "Sign Out"});
    if (await signOutButton.isVisible().catch(() => false)) {
        await signOutButton.click();
    }
})

test.beforeEach("Navigate to dashboard, this is where a signout button is visible", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard"); //for signed in user, this redirects to /lakeview-bowls/ where a sign out button is present
    const signOutButton = page.getByRole('button', { name: "Sign Out"});
    if (await signOutButton.isVisible().catch(() => false)) {
        await signOutButton.click();
  }
})
```
</details>

### Debugging
Sometimes a test would fail and I wasn't sure wh, as it was working previously. Despite the lab indicating I should purposefully break one - why not try to identify the issue with my booking journey. 
Updating the config, I turned on retries for local running - setting it to 1 retry. The reason for this is that store-traces was set to only on first retry. Also, with the inconsistency of a test failing only sometimes - i wanted it to also fail on the retry to be sure this is a legitimate issue. Below will be the sample code. Keynote: This test only failed on Chromium. 
<details> 
 <summary>Show debugging journey !</summary>


<details>
<summary>📌 Show Booking Journey Test: </summary>

 ```
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
            await page.getByText("Dashboard").click();
            // assert on lakeview-bowls homepage
            await page.waitForURL(/lakeview-bowls/)
            await expect(page).toHaveURL(/lakeview-bowls/);

            // as multiples of, assert there is at least one
            await expect(page.getByText("Rink 1 @ 12:00").first()).toBeVisible();            
        });
        

})
```
</details>

<details>
<summary>📌 Error Screenshots: </summary> 
<img width="665" height="854" alt="image" src="https://github.com/user-attachments/assets/5dacda44-3d80-4471-afeb-a2ae0ffa30bd" />
<img width="666" height="772" alt="image" src="https://github.com/user-attachments/assets/345ee829-0d75-4950-ab26-b277acf38c76" />
</details>

As can be seen from the above error screenshots, the test failed in the same step both times, "User dashboard has request visible"
<img width="634" height="143" alt="image" src="https://github.com/user-attachments/assets/ee05df4a-ed8b-4a5e-b0f3-5ac4ac65beb1" />
</br>But what's the issue? Let's look at the trace.
```
Error: locator.click: Error: strict mode violation: getByText('Dashboard') resolved to 2 elements:
    1) <a href="/dashboard" class="hover:bg-green-700 rounded px-3 py-2">Dashboard</a> aka getByRole('link', { name: 'Dashboard' })
    2) <div id="nextjs__container_errors_desc" class="nextjs__container_errors_desc ">…</div> aka getByText('Failed to execute \'measure\'')

Call log:
  - waiting for getByText('Dashboard')
```
This tells me there's an issue with the getByText selector, it is finding 2 possible HTML element options - this is never good as it wont know what to click next, hence the dashboard is never reached - and the final assertion never passes at it depends on the dashboard ! 
Playwright handily suggests an alternative option, more robust - getByRole('link', { name: 'Dashboard' }). I will update the code to use this, there is far less likelihood of confusion. 

After updating the locator, test passes !
<img width="667" height="422" alt="image" src="https://github.com/user-attachments/assets/f27a4618-1446-4b9e-988e-7245df7edee3" />

</details>
<hr>

### Refactoring ! Project Structure For Consistency
One thing that stood out a lot when watching the course was the usage of .env for storing details such as usernames and passwords. Of course! Why wouldn't you want a centralised place where you can change these values as needed - what if the seeded user changes, we'd have to replace every single instance it was mentioned!. So that's what I did - in an extension of this the course leader was also using Util files such as "uiPages" with reference to the url endpoints, e.g. 'login' = '/auth/login'. Now every time we need to navigate to the login page, we can simply use uiPages.login - this appends it to the defined baseUrl in environmentBaseUrls! Better yet - environmentBaseUrls lets us define these URLs for each environment - this way there is only a 1 line change in the .env file to change whether our tests run on localhost:3000 or the live server - awesome!

Files Added:
- utils
  1. environmentBaseUrls - for determining the baseUrl of where to test the application. e.g. local: 'https://localhost:3000'
  2. messages - for storing expected error messages. e.g. invalid email/password message - if devs change it, update it here.
  3. uiPages - urls for extending base URL. e.g. login page is at "localhost:3000/auth/login", so here login: "/auth/login" or dashboard: "/dashboard"
  4. pages - not too sure yet, similar to uiPages but not exactly.
- .env
  1.  Storing globally accessible variables relevant for testing such as user login details, admin logins, test environment (live/local/etc)
  2.  dotenv package for accessing this also added to the project
- pages
  1. created before, basically a POM for pages you might visit often - only existing one currently is 'login-page' for filling email/password forms and submission
  
Look, the goal here is to reduce as much code duplication as possible. The testing suite has also been split into separate files for testing functionality, e.g. into bowls-app-user-booking.spec.ts and bowls-app-user-login.spec.ts 


</hr>

### State Storage ( Oh No )
This took longer than I'd like to admit. The basic principle, is that UI tests should be as isolated as possible. Before implementing state storage - the user booking journey would require Playwright to go through all the user login steps, and then commence the booking journey. This introduces unnecessary fail-points that don't actually indicate how well the booking journey works at all. 

This is achieved by defining a globalSetup in the playwright config. There will likely have to be changes to this made though - currently it only knows how to sign in as a user. In the future this should be extended for such as adminState, userState, etc. In this implementation, globalSetup is defined and it is run at the start of each test. Have a look at the global-setup code below - it is creating a browser instance and logging in, then it is storing the session details such as cookies and storagestate into a reusable json file. This way, the booking journey can simply load from this state and be effectively signed in as the user. 
<details> <summary> global-setup Code </summary>

 ```
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
 
 ```
</details>

Now for our tests to actually use it we need to update the playwright config projects to use it. This should ideally run at the start of each test, though now remember we need to reset this state for our login tests - no good testing the login journey on a signed in account, is it?

<details> <summary> Show playwright config mess</summary>

 
 ```
export default defineConfig({
  /* ADDED BY JASON
  add globalSetup, this runs before any tests - gets a "logged-in" state details and stores it in a .json for reuse
  allows skipping of click-through sign-in*/
  globalSetup: require.resolve('./tests/setup/global-setup'),

  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /*ADDED BY JASON 
    ADD STORAGESTATE FOR STORING SIGNED-IN STATE
    CONFIGURE BASEURL TO USE ENV TO EASILY SWITCH BETWEEN WHICH URL TO USE E.G. LOCALHOST OR LIVE SERVER
    */
    storageState: 'storageState.json',
    
    baseURL: process.env.ENV === 'production' 
      ? baseEnvUrl.production.home
      : process.env.ENV === 'staging' 
        ? baseEnvUrl.staging.home
        : baseEnvUrl.local.home,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'],
             storageState: 'storageState.json',
            },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'],
            storageState: 'storageState.json',
       },
    }
```
</details>


<details> <summary> Resetting state for login testing </summary>

 ```
test.use( { storageState: { cookies: [], origins: [] }});   //reset storage state ?
test.describe.configure( { mode: 'serial'}); // as parallel causes issues

test.beforeEach( async ({page}) => {
    // await page.goto(pages.loginPage) // navigates to the defined EXTENSION of BASEURL
    await page.goto(uiPages.loginPage);
    loginPage = new LoginPage(page); //defines current page as LoginPage object to EXTEND methods
})
 ```

</details>

Enabling the user booking journey again, it works ! There is no need for the step to log the user in. Simply give the beforeEach the URL for the dashboard (courtesy of handy uiPages file) and let it run from there. The testing suite is now significantly faster.



