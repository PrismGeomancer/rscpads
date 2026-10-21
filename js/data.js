window.RP = (() => {
  const CONFIG={storageKey:'rescuepad.db.v1',legacyStorageKey:'rescuepad.demo.v1',xHandle:'rescuepad_',xUrl:'https://x.com/rescuepad_',version:1,tradingFee:0.01,split:{rescue:0.5,creator:0.4,platform:0.1},solEUR:140,solUSD:150,startingBalance:5,startingMC:5000,tokenSupply:1e9,graduationMC:50000,graduationInterval:5000,graduationPercentPerMinute:0.9,rescueMilestonesEUR:[100,250,500],useOfficialImages:false,rpcUrl:'https://api.mainnet-beta.solana.com',activityInterval:28000};
  const seed=[
    ['biscuit','Biscuit','BISCUIT','paws',78.4,24820,58,'dog','#d6b180','#8198b5','glasses','Internet dog helping real dogs. Zero thoughts. Good intentions.'],
    ['miso','Miso','MISO','scars',69.1,18760,52,'cat','#e5a158','#bea1c1','desk','The cat has opened a trading account. Nobody tell him.'],
    ['paros','Paros Pup','PAROS','paws',63.2,31240,64,'dog','#e4d2a4','#88b6bd','hat','Island dog. Mainland ambitions.'],
    ['rocket','Cardboard Rocket','ROCKET','refugio',61.8,22780,48,'dog','#ddc9a4','#bcb2cd','rocket','To the moon, in a box from the recycling bin.'],
    ['paw','The Big Paw','PAW','enpa',58.3,38940,67,'paw','#c6f58a','#577757','','One small paw. One very green candle.'],
    ['peanut','Peanut','PEANUT','apca',53.4,12460,39,'dog','#dab17c','#c1a984','peanut','Small dog. Big shell energy.'],
    ['crumb','Crumb','CRUMB','stray',50.5,9670,37,'dog','#e1ba8e','#b4baa2','bread','Not a single thought behind those eyes.'],
    ['bean','Bean','BEAN','anerpa',45.6,14890,42,'cat','#9daca0','#d6c48f','glasses','A professional napper with a rescue mission.'],
    ['orbit','Orbit','ORBIT','sgs',41.7,27410,46,'dog','#c5bda8','#829395','space','Lost in space. Found his purpose.'],
    ['tofu','Tofu','TOFU','scars',36.8,7180,28,'cat','#f0e4ca','#9dbaa4','halo','Soft cat. Hard commitment to the bit.'],
    ['olive','Olive','OLIVE','apca',32.9,11350,31,'dog','#aab074','#b2b69a','hat','A tiny olive with four legs.'],
    ['nugget','Nugget','NUGGET','refugio',28.3,5430,23,'dog','#c59557','#baa189','bread','Golden. Crispy. Extremely adoptable energy.']
  ];
  function chartFor(i){let v=70+i;return Array.from({length:40},(_,n)=>{v+=Math.sin(n*2.7+i)*4+0.85;return Math.max(20,v);});}
  function address(){const chars='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';return Array.from(crypto.getRandomValues(new Uint8Array(44)),x=>chars[x%chars.length]).join('');}
  function initial(){const now=Date.now();return {version:1,wallet:null,accounts:{},draft:{name:'',ticker:'',description:'',image:'',rescueId:'',step:1},tokens:seed.map((s,i)=>({id:s[0],name:s[1],ticker:s[2],rescueId:s[3],rescueCents:Math.round(s[4]*100),mc:s[5],trades:s[6],kind:s[7],color:s[8],bg:s[9],accessory:s[10],description:s[11],volumeSOL:s[4]/(CONFIG.solEUR*CONFIG.tradingFee*CONFIG.split.rescue),chart:chartFor(i),initialMC:s[5]*.78,contract:'Meme'+address().slice(4),createdAt:now-(12-i)*3600000,owner:null})),activity:[{id:'a1',text:'anon bought $BISCUIT · routed to PAWS Paros',time:now-60000,type:'trade'},{id:'a2',text:'$MISO is supporting SCARS',time:now-180000,type:'launch'},{id:'a3',text:'$ROCKET launched for El Refugio',time:now-420000,type:'launch'}]};}
  let state;let storageAvailable=true;
  try{const saved=JSON.parse(localStorage.getItem(CONFIG.storageKey)||localStorage.getItem(CONFIG.legacyStorageKey));state=saved?.version===CONFIG.version&&Array.isArray(saved.tokens)&&saved.accounts&&saved.draft?saved:initial();}catch{state=initial();}
  function save(){try{localStorage.setItem(CONFIG.storageKey,JSON.stringify(state));storageAvailable=true;return true;}catch{storageAvailable=false;return false;}}
  function change(fn){const before=JSON.stringify(state);const result=fn(state);if(!save()){state=JSON.parse(before);throw new Error('The database is full or unavailable. Free some space and try again.');}return result;}
  const token=id=>state.tokens.find(t=>t.id===id);
  const rescue=id=>RESCUES.find(r=>r.id===id);
  const account=()=>state.wallet?state.accounts[state.wallet.address]:null;
  const supporting=id=>state.tokens.filter(t=>t.rescueId===id);
  function rescueStats(id){const ts=supporting(id);return {cents:ts.reduce((a,t)=>a+t.rescueCents,0),tokens:ts.length,trades:ts.reduce((a,t)=>a+t.trades,0)};}
  // Graduation is a persistent milestone, separate from live wallet balances.
  function graduation(t){return Math.min(100,Math.max(t.graduationProgress||0,t.mc/CONFIG.graduationMC*100));}
  function trackGraduation(t){t.graduationProgress=graduation(t);if(t.graduationProgress>=100&&!t.graduatedAt)t.graduatedAt=Date.now();}
  function advanceGraduation(){return change(()=>{const reached=[];for(const [i,t] of state.tokens.entries()){
    const previous=graduation(t);if(previous>=100){trackGraduation(t);continue;}
    const step=CONFIG.graduationPercentPerMinute*CONFIG.graduationInterval/60000*(1+(i%5)*0.1);
    const gain=Math.min(step,100-previous),wasGraduated=!!t.graduatedAt;
    // Small anonymous buys generate fees through the same accounting as user trades.
    const amount=Math.max(.02*(1+(i%5)*.25)*gain/step,.01/(CONFIG.solEUR*CONFIG.tradingFee*CONFIG.split.rescue));
    market(t,'buy',amount,CONFIG.graduationMC*gain/100/t.mc);
    t.graduationProgress=Math.min(100,Math.max(previous+gain,graduation(t)));trackGraduation(t);
    if(!wasGraduated&&t.graduatedAt){reached.push(t.id);activity(`$${t.ticker} reached GRAD · ${money(t.rescueCents)} rescue allocation`,'graduation');}
  }return reached;});}
  function allocationMilestones(cents){const steps=CONFIG.rescueMilestonesEUR.map(euros=>({targetCents:Math.round(euros*100),reached:cents>=Math.round(euros*100)}));const next=steps.find(step=>!step.reached);const target=next?.targetCents||steps.at(-1).targetCents;return {steps,nextCents:next?.targetCents||null,remainingCents:Math.max(0,target-cents),progress:Math.min(100,Math.floor(cents/target*100)),completed:steps.filter(step=>step.reached).length};}
  function userRescueSupport(){const a=account();if(!a)return [];const groups=new Map();const group=id=>{if(!groups.has(id))groups.set(id,{rescueId:id,cents:0,tokenIds:new Set(),launchedIds:new Set()});return groups.get(id);};const mine=state.tokens.filter(t=>t.owner===state.wallet.address);const ownedIds=new Set(mine.map(t=>t.id));for(const t of mine){const row=group(t.rescueId);row.cents+=t.rescueCents;row.tokenIds.add(t.id);row.launchedIds.add(t.id);}for(const trade of a.history){if(ownedIds.has(trade.tokenId))continue;const row=group(trade.rescueId);row.cents+=trade.feeCents;if(token(trade.tokenId))row.tokenIds.add(trade.tokenId);}return [...groups.values()].map(row=>({...row,tokenIds:[...row.tokenIds],launchedIds:[...row.launchedIds]})).sort((a,b)=>b.cents-a.cents||rescue(a.rescueId).name.localeCompare(rescue(b.rescueId).name));}
  function totals(){return {cents:state.tokens.reduce((a,t)=>a+t.rescueCents,0),tokens:state.tokens.length,trades:state.tokens.reduce((a,t)=>a+t.trades,0),rescues:RESCUES.length};}
  function activity(text,type='trade'){state.activity.unshift({id:address().slice(0,10),text,type,time:Date.now()});state.activity=state.activity.slice(0,70);}
  function market(t,side,amount,growth=null){const gross=amount*CONFIG.solEUR;const feeCents=Math.round(gross*CONFIG.tradingFee*CONFIG.split.rescue*100);t.volumeSOL+=amount;t.trades++;t.rescueCents+=feeCents;t.mc=Math.max(100,t.mc*(1+(side==='buy'?1:-1)*(growth??Math.min(.12,.006+amount*.025))));t.chart.push(t.chart.at(-1)*(1+(side==='buy'?1:-1)*(growth??Math.min(.1,.008+amount*.03))));t.chart=t.chart.slice(-70);trackGraduation(t);return feeCents;}
  function trade(id,side,amount){if(!state.wallet)throw new Error('Connect a wallet to trade.');if(!['buy','sell'].includes(side)||!Number.isFinite(amount)||amount<=0||amount>1000)throw new Error('Enter a valid amount between 0 and 1,000 SOL.');const t=token(id),a=account();if(!t)throw new Error('This meme was not found.');const unitPrice=t.mc/CONFIG.solUSD/CONFIG.tokenSupply;const units=amount/unitPrice;const holdings=a.holdings[id]||0;
    if(side==='buy'&&amount>a.balance+1e-10)throw new Error('Not enough SOL. Try a smaller amount.');if(side==='sell'&&units>holdings+1e-5)throw new Error('Not enough tokens. Pick a smaller amount or use Max.');
    return change(()=>{if(side==='buy'){a.balance=Math.max(0,a.balance-amount);a.holdings[id]=holdings+units*(1-CONFIG.tradingFee);}else{a.balance+=amount*(1-CONFIG.tradingFee);a.holdings[id]=Math.max(0,holdings-units);}const cents=market(t,side,amount);const record={id:address().slice(0,10),tokenId:id,ticker:t.ticker,rescueId:t.rescueId,side,amount,units:side==='buy'?units*(1-CONFIG.tradingFee):units,feeCents:cents,time:Date.now()};a.history.unshift(record);a.history=a.history.slice(0,300);activity(`you ${side==='buy'?'bought':'sold'} ${amount.toFixed(3)} SOL of $${t.ticker} · ${money(cents)} rescue allocation`);return record;});}
  function createToken(d){if(!state.wallet)throw new Error('Connect a wallet first.');if(!d.name.trim()||!/^\w{2,10}$/.test(d.ticker)||!rescue(d.rescueId)||!d.description.trim())throw new Error('Complete the meme details and select a rescue.');if(state.tokens.some(t=>t.ticker===d.ticker.toUpperCase()))throw new Error('That ticker is already in use. Pick another.');return change(()=>{const t={id:'meme-'+address().slice(0,10),name:d.name.trim().slice(0,32),ticker:d.ticker.toUpperCase(),description:d.description.trim().slice(0,240),image:d.image||'',rescueId:d.rescueId,kind:'dog',color:'#d6b180',bg:'#8198b5',accessory:'glasses',mc:CONFIG.startingMC,initialMC:CONFIG.startingMC,trades:0,volumeSOL:0,rescueCents:0,chart:chartFor(2),contract:'Meme'+address().slice(4),createdAt:Date.now(),owner:state.wallet.address};state.tokens.unshift(t);account().launches.unshift({tokenId:t.id,time:Date.now()});activity(`$${t.ticker} launched for ${rescue(t.rescueId).name}`,'launch');state.draft={name:'',ticker:'',description:'',image:'',rescueId:'',step:1};return t;});}
  const money=cents=>'€'+(cents/100).toLocaleString('en-IE',{minimumFractionDigits:2,maximumFractionDigits:2});
  const usd=n=>'$'+Math.round(n).toLocaleString('en-US');
  const compact=n=>n>=1000?(n/1000).toFixed(1)+'k':Math.round(n).toString();
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const short=s=>s.slice(0,4)+'…'+s.slice(-4);
  state.tokens.forEach(t=>{if(t.contract?.startsWith('Demo'))t.contract='Meme'+t.contract.slice(4);trackGraduation(t);});
  save();
  return {CONFIG,graduation,advanceGraduation,get state(){return state;},get storageAvailable(){return storageAvailable;},save,change,address,token,rescue,account,supporting,rescueStats,allocationMilestones,userRescueSupport,totals,activity,market,trade,createToken,money,usd,compact,escape,short,reset(){const next=initial();const before=state;state=next;if(!save()){state=before;throw new Error('Could not reset the database.');}}};
})();
