import {test,expect} from '@playwright/test';
test('source loading template hides and disables stale page content until navigation ends',async({page})=>{
 await page.goto('/?view=pending');await expect(page.getByLabel('Loading page content')).toBeVisible();await expect(page.getByRole('button',{name:'Previous page action'})).toHaveCount(0);await expect(page.locator('[inert]')).toHaveCount(1);
 await page.getByRole('button',{name:'Finish navigation'}).click();await expect(page.getByRole('button',{name:'Previous page action'})).toBeVisible();await expect(page.getByLabel('Loading page content')).toHaveCount(0);
});
