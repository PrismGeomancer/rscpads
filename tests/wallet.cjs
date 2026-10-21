// Protocol tests: wallet approval, rejection, events, discovery and static subpaths.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const origin=process.env.PREVIEW_URL||'http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{
  window.setInterval=()=>0;
  window.__address='11111111111111111111111111111111';
  window.__other='So11111111111111111111111111111111111111112';
  window.__change=null;window.__reject=false;window.__failRPC=false;
  const account=address=>({address,chains:['solana:mainnet'],features:[]});
  window.__standard={name:'Test Standard',chains:['solana:mainnet'],features:{
    'standard:connect':{async connect(){if(window.__reject)throw {code:4001,message:'Rejected'};return {accounts:[account(window.__address)]};}},
    'standard:events':{on(event,fn){window.__change=fn;return ()=>{window.__change=null;};}},
    'standard:disconnect':{async disconnect(){window.__didDisconnect=true;}}
  }};
  window.addEventListener('wallet-standard:app-ready',event=>event.detail.register(window.__standard));
  window.fetch=async()=>{if(window.__failRPC)throw new Error('Unavailable');return {ok:true,json:async()=>({result:{value:2500000000}})};};
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/#profile');
 await page.locator('#wallet-button').click();assert.equal(await page.locator('[data-provider=Phantom]').isDisabled(),true);
 assert.equal(await page.locator('[data-provider="Test Standard"]').isEnabled(),true);
 await page.evaluate(()=>window.__reject=true);await page.locator('[data-provider="Test Standard"]').click();
 await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('cancelled'));assert.equal(await page.evaluate(()=>RP.state.wallet),null);
 await page.evaluate(()=>window.__reject=false);await page.locator('[data-provider="Test Standard"]').click();
 await page.waitForFunction(()=>RP.state.wallet?.real===true);assert.equal(await page.locator('[data-live-balance]').innerText(),'2.5 SOL');
 await page.evaluate(()=>location.hash='token/biscuit');await page.locator('[data-action=save-token]').click();
 await page.evaluate(()=>location.hash='profile');assert.ok((await page.locator('.saved-memes').innerText()).includes('$BISCUIT'));
 await page.evaluate(()=>window.__change({accounts:[{address:window.__other,chains:['solana:mainnet']}]}));
 assert.equal(await page.evaluate(()=>RP.state.wallet.address),await page.evaluate(()=>window.__other));assert.equal(await page.locator('.saved-memes .token-card').count(),0);
 await page.evaluate(()=>window.__change({accounts:[{address:window.__address,chains:['solana:mainnet']}]}));assert.equal(await page.locator('.saved-memes .token-card').count(),1);
 await page.evaluate(()=>{window.__failRPC=true;return Wallet.refreshBalance();});assert.equal(await page.locator('[data-live-balance]').innerText(),'Balance unavailable');
 await page.evaluate(()=>{window.__failRPC=false;return Wallet.refreshBalance();});assert.equal(await page.locator('[data-live-balance]').innerText(),'2.5 SOL');
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});for(const route of ['home','explore','rescues','profile','launch','token/biscuit','docs']){await page.evaluate(route=>location.hash=route,route);await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`${route} at ${width}`);}}
 await page.evaluate(()=>location.hash='profile');await page.evaluate(()=>window.__change({accounts:[]}));assert.equal(await page.evaluate(()=>RP.state.wallet),null);
 await page.evaluate(()=>Wallet.connect('Test Standard'));await page.evaluate(()=>Wallet.disconnect());assert.equal(await page.evaluate(()=>window.__didDisconnect),true);
 await page.evaluate(()=>Wallet.connect('Test Standard'));await page.reload();assert.equal(await page.evaluate(()=>RP.state.wallet),null);await page.evaluate(()=>Wallet.connect('Test Standard'));await page.evaluate(()=>location.hash='profile');assert.equal(await page.locator('.saved-memes .token-card').count(),1);
 // Simulate a GitHub Pages project base without changing the source files.
 await page.route('**/repository/**',route=>{const url=new URL(route.request().url());route.continue({url:origin+url.pathname.replace('/repository/','/')+url.search});});
 await page.goto(origin+'/repository/index.html#rescues');assert.equal(await page.locator('.rescue-card').count(),8);assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(18, 18, 17)');
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: Standard discovery, approval, rejection, account isolation, saved memes, balance success/failure, disconnect, persisted profiles, responsive pages and repository subpath.');
})().catch(error=>{console.error(error);process.exit(1);});
