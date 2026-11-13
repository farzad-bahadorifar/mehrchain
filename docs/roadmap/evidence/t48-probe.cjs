// Run against the real local production bundle, intercepting every API response.
// Requires a local production-preview server; no external account/network is used.
const {chromium}=require(process.env.MEHRCHAIN_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path');
const out=__dirname;
const user={id:'t48-me',username:'t48.viewer',name:'Synthetic Viewer',email:'viewer@example.invalid',timeZone:'UTC',createdAt:'2026-11-01T12:00:00Z'};
const calendar={timeZone:'UTC',currentDayKey:'2026-11-05',serverNow:'2026-11-05T09:00:00Z',nextDayAt:'2026-11-06T00:00:00Z'};
const habit={id:'t48-own',userId:user.id,title:'Read ten pages',category:'growth',isPublic:true,isArchived:false,totalDays:-1,currentDay:4,currentStreak:4,history:[],startDate:'2026-11-01T12:00:00Z',lastCompletedDate:'2026-11-05T08:00:00Z',isCompletedToday:true,calendar};
const connection={id:'t48-link',generationId:'t48-generation',userId:user.id,partnerId:'t48-partner',userCommitmentId:habit.id,partnerCommitmentId:'t48-other',status:'ACTIVE',consecutiveMissedDays:0,createdAt:'2026-11-01T12:00:00Z',heartSent:false,partner:{username:'t48.partner',name:'Synthetic Partner'},partnerCommitment:{title:'A short walk',category:'health',isCompletedToday:true,lastCompletedDate:'2026-11-05T08:00:00Z'},calendar,partnerCalendar:calendar};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[],errors=[],requests=[];
 try{
  for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   let sent=false,mode='normal';
   await context.addInitScript(({user,theme})=>{localStorage.setItem('mehrchain_auth_user_v1',JSON.stringify(user));localStorage.setItem('mehrchain_auth_token_v1','t48-synthetic-remote-token');localStorage.setItem('mehrchain_theme_mode_v1',theme);},{user,theme});
   await context.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname.includes('/api/')){
     requests.push({path:u.pathname,method:route.request().method(),theme});
     if(u.pathname.endsWith('/auth/me'))return route.fulfill({json:user});
     if(u.pathname.endsWith('/commitments/sync'))return route.fulfill({json:{commitments:[habit],archivedCommitments:[],calendar}});
     if(u.pathname.endsWith('/chain/connections'))return route.fulfill({json:[{...connection,heartSent:sent,heartSentAt:sent?'2026-11-05T09:00:00Z':null,...(mode==='stale'?{partnerCalendar:undefined}: {})}]});
     if(u.pathname.endsWith('/heart')){await new Promise(r=>setTimeout(r,500));if(mode==='failure')return route.fulfill({status:503,json:{message:'Synthetic unavailable response'}});sent=true;return route.fulfill({json:{...connection,heartSent:true,heartSentAt:'2026-11-05T09:00:00Z'}});}
     if(u.pathname.includes('disconnect-receipts'))return route.fulfill({json:[]});
     return route.fulfill({json:[]});
    }
    if(u.hostname==='127.0.0.1')return route.continue();
    return route.abort();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push({theme,error:e.message}));
   await page.goto('http://127.0.0.1:4186/chain');
   await page.locator('app-chain-card').waitFor({timeout:60000});
   await page.evaluate(theme=>document.documentElement.classList.toggle('dark',theme==='dark'),theme);
   const heart=()=>page.locator('app-chain-card button').first();
   async function capture(state){
    const sample=await page.locator('app-chain-card lucide-icon[name="heart"]').evaluate(host=>{const svg=host.querySelector('svg'),p=svg?.querySelector('path');const c=e=>e?{class:e.getAttribute('class'),fillAttribute:e.getAttribute('fill'),fill:getComputedStyle(e).fill,stroke:getComputedStyle(e).stroke,color:getComputedStyle(e).color}:null;return {documentDark:document.documentElement.classList.contains('dark'),host:c(host),svg:c(svg),path:c(p),buttonLabel:host.closest('button')?.getAttribute('aria-label'),disabled:host.closest('button')?.disabled}});
    results.push({theme,state,...sample});return sample;
   }
   await capture('unsent');
   mode='failure';await heart().click();await page.locator('button[aria-label="Saving heart"]').waitFor();await capture('pending');await page.getByText('Heart was not saved. Please retry.',{exact:true}).waitFor();await capture('failure');
   mode='normal';await heart().click();await page.locator('button[aria-label="Heart sent for this habit today"]').waitFor();await capture('confirmed-sent');
   await page.screenshot({path:path.join(out,`t48-confirmed-${theme}.png`),fullPage:true});
   await page.reload();await page.locator('button[aria-label="Heart sent for this habit today"]').waitFor();await page.evaluate(theme=>document.documentElement.classList.toggle('dark',theme==='dark'),theme);await capture('reload-sent');
   await page.addStyleTag({content:'app-chain-card lucide-icon.fill-rose-500 svg { fill: currentColor; }'});await capture('diagnostic-css-only');
   mode='stale';await page.reload();await page.getByText('Refresh required',{exact:true}).waitFor();await page.evaluate(theme=>document.documentElement.classList.toggle('dark',theme==='dark'),theme);await capture('stale');
   await context.close();
  }
 }finally{await browser.close();fs.writeFileSync(path.join(out,'t48-rendered-states.json'),JSON.stringify({date:'2026-11-05',kind:'synthetic API, real local production bundle',results,errors,requests},null,2));}
 console.log(JSON.stringify({states:results.length,errors,statesSummary:results.map(r=>({theme:r.theme,state:r.state,hostFill:r.host?.fill,svgFill:r.svg?.fill,pathFill:r.path?.fill,disabled:r.disabled}))},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
