# Playwright Training Labs
Public repository to show journey of learning automation testing with Playwright framework. Testing conducted on proprietary Bowls application which requires access.
Base URL for testing set to 'localhost:3000', assumption that localhost server is active before test suite is ran. 



### Test Suite Synatix
Within a test suite tests typically have a title, followed by the expectation. 
You can use .describe to add a description that will be shown if the test fails. 
#### Test Annotations 
Individual Test Structure: 

test('has title', async ({ page }) => { </br>
&emsp;  await page.goto('localhost:3000/'); </br>
&emsp;  await expect(page).toHaveTitle(/Club Management Platform/); </br>
});

However, you can modify the format of the above to adjust your test cases:
- test.describe("group of tests") => test('test one'...
- test.skip('doesnt run') => ...
- test.fail('this'll run and fail') => ...
- test.fixme('this won't run and will fail') => ...
- test.slow('this test is slow, so timeout has been extended') => ...

These annotations can be applied to standalone or grouped tests.
