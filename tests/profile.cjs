// Wallet-free profile sign-in and database migration. Run like the other browser suites; see README.md.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const file='file://'+path.resolve(__dirname,'../index.html');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await (await browser.newContext({viewport:{width:1440,height:1000}})).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(file);
 // Legacy data is migrated into the new database key.
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('rescuepad.db.v1'));s.draft.name='Carried over';localStorage.removeItem('rescuepad.db.v1');localStorage.setItem('rescuepad.demo.v1',JSON.stringify(s));});
 await page.reload();assert.equal(await page.evaluate(()=>RP.state.draft.name),'Carried over');
 assert.ok(await page.evaluate(()=>!!localStorage.getItem('rescuepad.db.v1')));
 // Sign in without a wallet, trade, launch, save a meme.
 await page.locator('#wallet-button').click();await page.locator('[data-action=profile-login]').click();
 await page.waitForFunction(()=>RP.state.wallet);const address=await page.evaluate(()=>RP.state.wallet.address);
 assert.equal(await page.evaluate(()=>RP.state.wallet.real),false);
 assert.ok((await page.locator('#wallet-button').innerText()).includes('…'));
 await page.goto(file+'#token/biscuit');await page.locator('#trade-amount').fill('0.5');await page.locator('#trade-form button[type=submit]').click();
 await page.waitForFunction(()=>RP.account().history.length===1);
 await page.locator('[data-action=save-token]').click();await page.waitForFunction(()=>RP.account().favorites.length===1);
 await page.goto(file+'#profile');assert.equal(await page.locator('.wallet-summary').count(),0);
 assert.ok((await page.locator('.section-header').innerText()).includes('PROFILE'));
 // Sign out keeps the profile; signing back in restores the same data.
 await page.locator('[data-action=disconnect]').click();await page.waitForFunction(()=>!RP.state.wallet);
 await page.locator('#wallet-button').click();await page.locator('[data-action=profile-login]').click();await page.waitForFunction(()=>RP.state.wallet);
 assert.equal(await page.evaluate(()=>RP.state.wallet.address),address);assert.equal(await page.evaluate(()=>RP.account().history.length),1);
 // Persists across reload; no demo/simulation wording is shown anywhere.
 await page.reload();assert.equal(await page.evaluate(()=>RP.state.accounts[RP.state.profileAddress].history.length),1);
 for(const route of ['home','explore','rescues','leaderboard','profile','launch','docs','token/biscuit']){await page.goto(file+'#'+route);const text=(await page.locator('body').innerText()).toLowerCase();for(const word of ['demo','simulat','mvp','fictional','v0.1','this browser'])assert.ok(!text.includes(word),`"${word}" found on ${route}`);}
 assert.deepEqual(errors,[]);
 console.log('PASS: wallet-free profile, trading, saved memes, sign out/in restore, migration, wording and no errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
