# Playwright Training Labs
Public repository to show journey of learning automation testing with Playwright framework. Testing conducted on proprietary Bowls application which requires access.
Base URL for testing set to 'localhost:3000', assumption that localhost server is active before test suite is ran. 

<hr>

<details> <Summary> <b> Playwright Stuff </b></Summary>


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

</details>

# Postman Training !
Postman is an interface used to test API's. APIs are fundamentally a way for two pieces of code to interact with each other, most commonly used to allow web applications to communicate with databases. This is done similar to web browsers through URL's. A command type is decided and a request location is sent. APIs consist of an API contract, being the Request (to endpoint) and the Response (from).

#### Request
- Endpoint
- Headers
- Body

#### Response
- Status Code
- Headers
- Body

<hr>

<details> <summary> Request Types:</summary>
 
 - 'GET' - for queries, information retrieval 
 - 'POST' - to create, POST requests tell a database to add {this}
 - 'PUT' - to replace an existing resource, e.g. put User1 details in User2
 - 'PATCH' - modify a part of an entry, e.g. replace User1 email with this new email
 - 'DELETE' - to remove from, e.g. delete User1

</details>

<hr>

<details> <summary> Status Codes: </summary>
Status codes are sent within the request to tell the requester what happened. These fall in ranges, being 2XX, 3XX, 4XX, 5XX. More information on these is given below: </br>

- 2XX: Success - 200 OK, 201 Created, 204 No Content (e.g. fetches empty database)
- 3XX: Redirect - 301, 302
- 4XX: Client Error, wrong request = 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable
- 5XX Server Error, app failure - 500 Internal Server Error, 503 Service Unavailable 
 
</details>

<hr>

P.O.I.S.E.D Testing Heuristic provides a framework for API testing:
<details>
 
- Parameters
  - Check the inputs accepted. What if some are missing, additional inputs, or out of range? e.g. Booking a rink outside of operating hours.
- Output
  - Is the response correct? Formatted correctly, complete, with the correct status code provided?
- Interop
  - Is the API valid on all systems - remember that it can be accessed from outside a browser. Does it work on phone/browser/external app?
- Security
  - Authentication required? Who can see, call, edit, delete the database.
- Errors
  - When things go wrong - is it clear? Are they handled correctly?
  - Determine what went wrong, e.g. 400 Bad Request - email form field formatted incorrectly. 
- Data
  - Storage and changes - are they returned correctly, consistent at edges? e.g. submit score -1 in the league table. 

</details>

<hr> 

### Bowls Club App Authentication with Example Request Collection
APIs can require authentication in many different ways, with the goal to increase security and traceability. For example, being able to log WHO deleted WHAT from a database. As we already know, API URLs are publicly accessible, so proper steps need to be taken to prevent malicious actors or mistaken users from corrupting the system. Here I will explain HOW the Bowls app authenticates its API requests, then cover some example POST, GET, PUT requests from a Postman collection.

<hr>

#### Authentication

The bowls application uses CSRF (Cross-Site Request Forgery) tokens, this is a random value that is associated with a users session. But how do we get the Postman client one of these tokens? With a little (a lot) help from Kieran Ellis, we have figured it out. By generating a POST request to the credentials section of the API with a Body containing login details, we can receive cookies that authenticate the user. By setting up two collections with POST requests - one to authorize the session as an Admin of Lakeview Bowls, and another to authorize the session as a User - we can experiment with different levels of access and ensure certain requests are forbidden to a user - and even to admins.

<details> <summary>Show details</summary>

<img width="923" height="203" alt="image" src="https://github.com/user-attachments/assets/6c1ddc75-4bfb-45ca-9259-7726db438357" />

<img width="923" height="227" alt="image" src="https://github.com/user-attachments/assets/0ec8d537-6674-4312-aa8b-39200e966a67" />

The pm.environment simply accesses the local environment of Postman. This is where reusable variables such as baseUrl, adminEmail, adminPassword, csrfToken, etc are stored. This is particularly useful as it allows postman to switch between testing on the local server or the live server API with one environment change. Regardless, these scripts sign in as the provided account type (credentials in body) and update the session cookies accordingly. 
<img width="923" height="222" alt="image" src="https://github.com/user-attachments/assets/93889d60-9320-4862-a659-86e985afaaf9" />

</details>

The next parts of this readme will take place on a clean, freshly seeded server (npm run db:setup). The credentials for the user will be Doris Smith's account, and the admin is self explanatory. So - let's try out some requests !

<details> <summary> Postman Bowls Club Collection and Request Story </summary>

</br>
As explained, these requests will switch between User and Admin - I'll try as best I can to show WHO is making the request. 


### GET bookings
We'll do a GET bookings request for both User and Admin. As this is freshly seeded, there should be no bookings to show. The request is the same URL for both the club member and the admin.
<img width="925" height="111" alt="image" src="https://github.com/user-attachments/assets/1b0be1aa-425c-4529-b792-26117d329bd5" />



Club Member:

<img width="913" height="101" alt="image" src="https://github.com/user-attachments/assets/0f8a702a-976f-4040-8b3a-afa9a0ae5e57" />

200 OK Response, empty JSON signifies the club member has made no bookings.

Club Admin:

<img width="926" height="98" alt="image" src="https://github.com/user-attachments/assets/cd3b6652-8154-41d7-8cca-f15c80d37d22" />

As above, no bookings related to the entire club. 


### POST book a rink

So, no bookings? In preparations for this, I have updated the scripts attached to the above authentication requests to set an environment variable "bookAuthor" to "ClubAdmin" and "ClubMember" when authentication changes. This will make who has made which bookings easier to track. So, let's create a new booking through Postman. Booking date has been set to 01/01/2027.

Club Member:
<img width="922" height="266" alt="image" src="https://github.com/user-attachments/assets/0b8c2d9d-895f-47ba-b4cf-8461c4ac70d6" />
<img width="660" height="435" alt="image" src="https://github.com/user-attachments/assets/72d6659b-6ee0-40f4-b84b-5a007729f564" />

201 Created !! You can see that the playerName has been correctly set to "ClubMember". 

Authenticating as an Admin and running the GET bookings request again returns the following: 

<details> <<summary>Output JSON:</summary>

 ```

 [
    {
        "id": "cmvtqatp00008z4cxa66rtk50",
        "tenantId": "cmvtpmsjj0001h8cxyqva3zqa",
        "userId": "cmvtpmswx0005h8cx6ma94hvv",
        "date": "2027-06-19",
        "status": "REQUESTED",
        "createdAt": "2026-10-29T15:59:16.691Z",
        "updatedAt": "2026-10-29T15:59:16.691Z",
        "bookedByUserId": "cmvtpmswx0005h8cx6ma94hvv",
        "adminOverride": false,
        "overrideReason": null,
        "bookedByTenantId": null,
        "federationId": null,
        "slots": [
            {
                "id": "cmvtqatp60009z4cx0brlfyeq",
                "bookingId": "cmvtqatp00008z4cxa66rtk50",
                "rinkId": "seed-rink-7",
                "timeSlot": "10:00",
                "playerName": "ClubMember",
                "greenName": null,
                "rink": {
                    "id": "seed-rink-7",
                    "name": "Rink 7",
                    "greenId": "seed-green-2"
                }
            }
        ],
        "user": {
            "id": "cmvtpmswx0005h8cx6ma94hvv",
            "name": "Doris Smith",
            "email": "user@lakeview.club"
        },
        "bookedByUser": {
            "id": "cmvtpmswx0005h8cx6ma94hvv",
            "name": "Doris Smith",
            "email": "user@lakeview.club"
        },
        "payment": null
    }
]

```
</details>

Nice, there's now a booking in the system. So, how can we modify it? 

### PATCH update a booking status

We know from the requirements that only a club admin should be able to change a booking from REQUESTED to APPROVED. Luckily we have an admin account present to test this - so let's see what happens when we try on both a club member account and an admin account. First, some explaining of what's going on. 
<img width="920" height="149" alt="image" src="https://github.com/user-attachments/assets/1987ae77-c6a6-49d5-b4cb-b091328b758e" />

As you can see the endpoint URL is replaced with the environment variable bookingId. This is defined the script within our GET bookings - if a booking with status REQUESTED is found, it updates the variable with the ID. As we only have one booking in the database currently, we know what booking we will be targeting. 

<img width="928" height="172" alt="image" src="https://github.com/user-attachments/assets/d6be0c14-c50c-402d-9338-c0d8b8382f63" />

So, as the MEMBER - let's try and approve our own booking. 
<img width="933" height="165" alt="image" src="https://github.com/user-attachments/assets/9395192a-753b-45e4-bae2-7ff2cb51f766" />

Error 403 Forbidden, members don't have permissions to approve bookings.

Let's try as the admin.

<img width="929" height="340" alt="image" src="https://github.com/user-attachments/assets/e6f964d8-43d1-49a2-a954-0bff8933a7d9" />

200 OK ! As you can see, the status has been changed to approved. Double checking the state of the booking by running the GET request again:

<details><summary>Show JSON Body</summary>

```
[
    {
        "id": "cmvtqatp00008z4cxa66rtk50",
        "tenantId": "cmvtpmsjj0001h8cxyqva3zqa",
        "userId": "cmvtpmswx0005h8cx6ma94hvv",
        "date": "2027-06-19",
        "status": "APPROVED",
        "createdAt": "2026-10-29T15:59:16.691Z",
        "updatedAt": "2026-10-29T16:27:20.049Z",
        "bookedByUserId": "cmvtpmswx0005h8cx6ma94hvv",
        "adminOverride": false,
        "overrideReason": null,
        "bookedByTenantId": null,
        "federationId": null,
        "slots": [
            {
                "id": "cmvtqatp60009z4cx0brlfyeq",
                "bookingId": "cmvtqatp00008z4cxa66rtk50",
                "rinkId": "seed-rink-7",
                "timeSlot": "10:00",
                "playerName": "ClubMember",
                "greenName": null,
                "rink": {
                    "id": "seed-rink-7",
                    "name": "Rink 7",
                    "greenId": "seed-green-2"
                }
            }
        ],
        "user": {
            "id": "cmvtpmswx0005h8cx6ma94hvv",
            "name": "Doris Smith",
            "email": "user@lakeview.club"
        },
        "bookedByUser": {
            "id": "cmvtpmswx0005h8cx6ma94hvv",
            "name": "Doris Smith",
            "email": "user@lakeview.club"
        },
        "payment": null
    }
]

```

</details>


</details>

<hr>

### Headers and Bodies ! 

So, previously we explored the different kinds of requests. We looked at the formatting for adding a booking to the database with a POST request - let's have a look at what happens if this request is corrupted, the booking is missing fields and so on - what does the response look like? 

<details> <summary> Headers and Bodies Evidence </summary>
<img width="925" height="267" alt="image" src="https://github.com/user-attachments/assets/abea88e0-10b4-430d-b596-31fbf19cd911" />

This is the default POST request body for adding a booking, all required fields are present and the rest will be populated by the Headers, being the authentication cookie outlined in the previous section. The response JSON is simply the booking that was created, with a status code of 201 for created - all good there. Let's begin modifying some fields.

<details><summary>Response JSON</summary>

```
{
    "id": "cmvurb8tl000jz4cxxxfsbyzx",
    "tenantId": "cmvtpmsjj0001h8cxyqva3zqa",
    "userId": "cmvtpmsqu0004h8cxepbgp3tq",
    "date": "2027-08-28",
    "status": "REQUESTED",
    "createdAt": "2026-10-30T09:15:22.087Z",
    "updatedAt": "2026-10-30T09:15:22.087Z",
    "bookedByUserId": "cmvtpmsqu0004h8cxepbgp3tq",
    "adminOverride": false,
    "overrideReason": null,
    "bookedByTenantId": null,
    "federationId": null,
    "slots": [
        {
            "id": "cmvurb8tu000kz4cxnolf8m72",
            "bookingId": "cmvurb8tl000jz4cxxxfsbyzx",
            "rinkId": "seed-rink-7",
            "timeSlot": "10:00",
            "playerName": "ClubAdmin",
            "greenName": null
        }
    ]
}
```
</details>

<hr>

#### Malformed JSON
What happens if the JSON body in the request is formatted incorrectly? 
<img width="912" height="234" alt="image" src="https://github.com/user-attachments/assets/6c8016ce-5666-4dad-9c59-f9c188606770" />
<img width="919" height="112" alt="image" src="https://github.com/user-attachments/assets/fe686ad9-c8e0-4287-a794-e76f83eed295" />

We get a 500 Internal Server Error. From the course, I'm not sure this should be the response - it should be a 400 Bad Request. Though maybe it is ISE because it doesn't know what to do, it's not recognized as JSON.

<hr>

#### Extra Fields
What happens if we add extra fields to the JSON body that aren't in the database?
<img width="922" height="280" alt="image" src="https://github.com/user-attachments/assets/3cad9a00-c022-4514-bc66-f039e8117581" />
Interestingly, the request is still 201; but the extra field doesn't show up in the Response Body. 

<details><summary>Show Response Body</summary>

```
{
    "id": "cmvuri1dp000nz4cxxxr468vl",
    "tenantId": "cmvtpmsjj0001h8cxyqva3zqa",
    "userId": "cmvtpmsqu0004h8cxepbgp3tq",
    "date": "2027-05-26",
    "status": "REQUESTED",
    "createdAt": "2026-10-30T09:20:39.037Z",
    "updatedAt": "2026-10-30T09:20:39.037Z",
    "bookedByUserId": "cmvtpmsqu0004h8cxepbgp3tq",
    "adminOverride": false,
    "overrideReason": null,
    "bookedByTenantId": null,
    "federationId": null,
    "slots": [
        {
            "id": "cmvuri1dt000oz4cx0fk7n1nh",
            "bookingId": "cmvuri1dp000nz4cxxxr468vl",
            "rinkId": "seed-rink-7",
            "timeSlot": "10:00",
            "playerName": "ClubAdmin",
            "greenName": null
        }
    ]
}

```

</details>

That was in the "slots" key though, let's try adding another field outside of that.
<img width="918" height="282" alt="image" src="https://github.com/user-attachments/assets/329cb150-b61d-4800-b685-d3afcedf69e0" />

Again, it goes through and the booking is created - stripping the extra information.

<hr>

#### Missing Fields
So, extra fields go through and are stripped, okay. What happens when presumably critical information relating to a booking is missing? For example, the time slot is pretty important - let's remove it.
<img width="922" height="284" alt="image" src="https://github.com/user-attachments/assets/a4ded5ea-401c-4577-8ab8-3b66f1f85365" />

<img width="915" height="104" alt="image" src="https://github.com/user-attachments/assets/78c64513-13f9-46d3-bb0b-8afd5acc427e" />


Again, 500 Internal Server Error. I am more certain that this one should be a 400 Bad Request with a handy error message such as "time-slot not found" or otherwise for logging purposes.

</details>

<hr>

### Assertions 

Okay, sped through the previous sections a bit but now have a decent handle on before/after scripting (to set up local environment variables for authentication) and different response codes, request and response headers and bodies. In this section I will go through setting up some assertions. The first will be that a Club Member cannot approve their own booking.

The flow will look like this:
- Authorise as Club Member and store cookies (assert 200 OK)
- POST a booking at a valid time (assert 201 created)
- GET bookings, storing booking ID of a booking with status "REQUESTED" to local environment. (assert that one is found)
- PATCH this booking ID, updating status to approved (assert Unauthorized error)

<details> <summary>Collection Testing Flow:</summary>

## POST Authorize As Club Member 
Two test cases, one on the status code 200: OK, and another on the expected Response body, as on a successful validation the URL is returned. 

```
pm.sendRequest(`${pm.environment.get("baseUrl")}/api/auth/csrf`, (err, res) => {
  if (err) throw err;
  // if response is successful set token and author
  pm.environment.set("csrfToken", res.json().csrfToken);
  pm.environment.set("bookingAuthor", "TestMemberBookingApproval")

  // assert response code 200
    pm.test("Status code is 200", function () {
        pm.response.to.have.status(200);
    });
  // and response body is baseUrl
    pm.test("Response body contains baseUrl", function () {
        pm.expect(pm.response.text()).to.include(pm.environment.get("baseUrl"));
    })
});

```

## POST Club Member Creates A Booking Request
<img width="698" height="264" alt="image" src="https://github.com/user-attachments/assets/0b059738-590b-452c-8e1d-70fa1b6089e8" />

As you can see, the booking date uses a local environment variable. This is randomly generated and assigned in the "before request" script section:

```
const d = new Date();
d.setDate(d.getDate() + 30 + Math.floor(Math.random() * 300));
pm.environment.set("bookingDate", d.toISOString().slice(0, 10));
```

Assertions are defined in the "After response" section. As we are creating a booking here, we want to test for Response Status Code 201: Created, we also want to extract the ID of the booking into a local environment variable for the next 'steps' or requests in the collection. So we'll first test that the new booking in the response body has status REQUESTED, then extract the ID. 

```
  // assert response code 201
    pm.test("Status code is 201", function () {
        pm.response.to.have.status(201);
    });
  // and response body is baseUrl
    pm.test("Response body contains status: REQUESTED", function (){
        pm.expect(pm.response.json().status).to.eql("REQUESTED");
    })

    pm.environment.set("bookingId", pm.response.json().id) 
```


## GET Booking Request Found In Database
Another GET Request to fetch bookings, then using the stored local environment bookingId variable to ensure that our new booking was successfully stored and is retrievable. 

After response script: 

```
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
})

const bookingIdToFind = pm.environment.get("bookingId");

const b = pm.response.json().find(x => x.id === bookingIdToFind);
pm.test("Booking ID matches", () => {
    pm.expect(b.id).to.eql(bookingIdToFind);
});

pm.test("Booking status is REQUESTED", () => {
    pm.expect(b.status).to.eql("REQUESTED");
});

```

## PATCH Club Member Approving Booking Forbidden
Now we are going to have the 'member' attempt to update their own booking status to APPROVED. This is forbidden, and should be handled by a club admin. But what happens if they try? 

Request Body:

<img width="702" height="194" alt="image" src="https://github.com/user-attachments/assets/2ce1b59d-f6fa-49ec-802f-b3655bcac2bb" />

Response:

<img width="711" height="151" alt="image" src="https://github.com/user-attachments/assets/7a300092-8eae-4de2-a391-274993bf57ba" />

After response test script:
```
pm.test("Status code is 403", function () {
    pm.response.to.have.status(403);
});
```

## Testing Whole Collection
Now running the entire collection looks like this: 

Define Run Order and Run Type:

<img width="734" height="515" alt="image" src="https://github.com/user-attachments/assets/5cf364d2-f5d2-41ae-898a-5467ed8330f8" />

Run Results:

<img width="841" height="715" alt="image" src="https://github.com/user-attachments/assets/29736e89-1169-4857-9654-2ebe65617fca" />

Some issues occur if my environment variables aren't as consistent as I'd like. I think I need to experiment with setting environment variables for each "collection" and using that - this way I can reset them to a default state for test consistency, 

</details>

<hr>

### Newman !

Nevermind lol


### POISED Negative Testing
This will be the last thing I attempt this week, so it is unlikely to get very far. But I'd like to write out my thought process for what POISED looks like when examining a certain endpoint. For flexibility, I've chosen the new user Registration form, as this has available fields that are accessible. Though - not sure how to access the database of users to double check that none have slipped through - but I guess the Response body should be enough to validate this, i.e. if it's not 201 status code, it appropriately got rejected.

#### User Registration Post Request
By copying the cUrl from a browser when registering a new user, we can see what the api request looks like for registration: 

<img width="850" height="712" alt="image" src="https://github.com/user-attachments/assets/a0c48ab6-6b6f-4b99-8e5d-18c257709ee2" />

As you can see, this request was successful - with Status Code 201. The Response Body contains the created account information, with ID, Role, Email, Name, and tenantId (referencing the club lakeview-bowls). No password is shown, which is good - as it implies the server is not sending out unencrypted passwords over the internet which would assumedly be a security issue. 

Okay, so the account was created. Without changing a thing, let's run the request again. You'd want to see a 400 bad request, as the email is already registered to an account. 

<img width="846" height="642" alt="image" src="https://github.com/user-attachments/assets/6c50bfbd-655a-4c0a-adfe-6780a32e4b6a" />

Okay, error message detailing what went wrong "Email already registered", which we know to be true. Error code 409 Conflict is a new one, but it makes sense. If a database requires unique emails and that's a constraint on that field - it wont allow the request. 
