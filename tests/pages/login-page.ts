// Class that holds references to the login page of the bowls club application.
// Will contain locators for different fields, methods for typing within them 

import { expect, type Locator, type Page } from "@playwright/test"
import messages from "../utils/messages"

export class LoginPage {

    readonly page:Page;
    // the actual button that submits the form of login details.
    // in the current iteration it has text "Sign In"
    readonly submitSignInButton: Locator; 
    readonly emailFormField: Locator;
    readonly passwordFormField: Locator;


    // HTML warning that a form field should have an ID or name attribute for ease of finding in testing/accessibility
    constructor (page: Page) {
        this.page = page;
        this.submitSignInButton = page.getByRole('button', { name: ' Sign In'})
        this.emailFormField = page.getByPlaceholder("Email")
        this.passwordFormField = page.getByPlaceholder("Password")
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
    async doLogin(email: string, password: string) {
        await this.fillEmailFormField(email);
        await this.fillPasswordFormField(password);
        await this.clickSubmitLogin();

    }

    async checkLoggedIn() {
        // await this.page.waitForURL("/lakeview-bowls")
        await expect(this.page).toHaveURL(/lakeview-bowls/)
    }

    // Error message visible on the page.
    // retrieved from utils/messages. Update there if message changes
    async checkInvalidCredentials() {
        await expect(this.page.getByText(messages.login.invalid)).toBeVisible();
    }

    // async checkInvalidCredentialsMessage() {
    //     await this.page.wai
    // }
    
}


export default LoginPage;