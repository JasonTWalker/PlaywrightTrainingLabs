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
