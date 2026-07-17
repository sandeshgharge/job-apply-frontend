import test, { expect } from "@playwright/test";
import { environment } from "../src/environments/environment";


test("Go to Home page without login", async ({page}) =>{
    await page.goto(environment.frontendBaseUrl+'home');
    await expect(page).toHaveURL(environment.frontendBaseUrl+ 'login')
});

