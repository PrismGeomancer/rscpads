// Native Solana providers + the Wallet Standard discovery protocol. No CDN or build step.
window.Wallet=(()=>{
  const registered=new Set();
  const links={Phantom:'https://phantom.com/',Solflare:'https://solflare.com/',Backpack:'https://backpack.app/'};
  let active=null,off=()=>{},connecting=false,generation=0;
  let balance=null,balanceStatus='idle';
  // A stored address is a preference, never proof of an active wallet session.
  RP.state.wallet=null;RP.save();
  function refreshPicker(){if(window.UI&&document.querySelector('[data-wallet-picker]')&&!connecting)open();}
  const api=Object.freeze({register(...wallets){wallets.forEach(w=>registered.add(w));refreshPicker();return ()=>{wallets.forEach(w=>{registered.delete(w);if(active?.wallet===w)clear();});refreshPicker();};}});
  window.addEventListener('wallet-standard:register-wallet',event=>{if(typeof event.detail==='function')event.detail(api);});
  window.dispatchEvent(new CustomEvent('wallet-standard:app-ready',{detail:api}));
  function choices(){
    const items=[...registered].filter(w=>w.chains?.some(c=>c.startsWith('solana:'))&&w.features?.['standard:connect']).map(wallet=>({name:wallet.name,wallet}));
    const injected=[['Phantom',window.phantom?.solana||(window.solana?.isPhantom?window.solana:null)],['Solflare',window.solflare],['Backpack',window.backpack?.solana||window.backpack]];
    injected.forEach(([name,provider])=>{if(provider?.connect&&!items.some(w=>w.name===name))items.push({name,provider});});
    return items;
  }
  function accountFor(accounts){return accounts?.find(a=>a.chains?.some(c=>c.startsWith('solana:')));}
  function setAccount(address,name,real=true){
    if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))throw new Error('The wallet did not return a valid Solana address.');
    RP.change(s=>{s.accounts[address]??={balance:RP.CONFIG.startingBalance,holdings:{},history:[],launches:[],favorites:[],createdAt:Date.now()};s.wallet={provider:name,address,real};});
    balance=null;balanceStatus='idle';window.UI?.render();if(real)void refreshBalance();
  }
  function clear(){generation++;off();off=()=>{};active=null;balance=null;balanceStatus='idle';RP.state.wallet=null;RP.save();window.UI?.render();}
  async function connect(name){
    if(connecting)return;
    const item=choices().find(w=>w.name===name);
    if(!item){open();UI.toast('Install '+name+' or open this site in its wallet browser, then connect.');return;}
    connecting=true;const attempt=++generation;
    const buttons=document.querySelectorAll('[data-provider]');buttons.forEach(b=>b.disabled=true);
    try{
      const result=item.wallet?await item.wallet.features['standard:connect'].connect():await item.provider.connect();
      if(attempt!==generation)return;
      const address=item.wallet?accountFor(result.accounts)?.address:(result?.publicKey||item.provider.publicKey)?.toString();
      if(!address)throw new Error('No Solana account was shared by this wallet.');
      off();active=item;off=()=>{};
      setAccount(address,item.name);
      if(item.wallet?.features['standard:events'])off=item.wallet.features['standard:events'].on('change',event=>{
        if(active!==item||!('accounts' in event))return;
        const account=accountFor(event.accounts);if(!account){clear();return;}
        try{setAccount(account.address,item.name);}catch(error){clear();UI.toast(error.message);}
      });
      else if(item.provider?.on){
        const changed=key=>{if(active!==item)return;if(!key){clear();return;}try{setAccount(key.toString(),item.name);}catch(error){clear();UI.toast(error.message);}};
        const disconnected=()=>{if(active===item)clear();};
        item.provider.on('accountChanged',changed);item.provider.on('disconnect',disconnected);
        off=()=>{item.provider.removeListener?.('accountChanged',changed);item.provider.removeListener?.('disconnect',disconnected);};
      }
      UI.closeModal();UI.render();UI.toast(item.name+' connected. Your wallet profile is ready.');
    }catch(error){if(active===item)clear();UI.toast(error.code===4001||/reject|cancel/i.test(error.message)?'Connection cancelled. You can try again.':error.message||'Unable to connect. Unlock your wallet and try again.');}
    finally{connecting=false;buttons.forEach(b=>b.disabled=false);}
  }
  function useProfile(){
    if(connecting)return;
    off();off=()=>{};active=null;generation++;
    RP.change(s=>{s.profileAddress??=RP.address();});
    setAccount(RP.state.profileAddress,'RescuePad',false);
    UI.closeModal();UI.render();UI.toast('Signed in. Your profile is ready.');
  }
  async function disconnect(){const item=active;clear();UI.closeModal();try{if(item?.wallet)await item.wallet.features['standard:disconnect']?.disconnect();else await item?.provider?.disconnect();}catch{}UI.toast('Disconnected. Your profile is saved.');}
  async function refreshBalance(){
    if(!RP.state.wallet?.real)return;
    const address=RP.state.wallet.address,request=++generation;
    balanceStatus='loading';balance=null;updateBalance();
    try{
      const response=await fetch(RP.CONFIG.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:[address,{commitment:'confirmed'}]}),signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error('RPC unavailable');const data=await response.json();
      if(data.error||!Number.isFinite(data.result?.value))throw new Error('RPC unavailable');
      if(request!==generation||RP.state.wallet?.address!==address)return;
      balance=data.result.value/1e9;balanceStatus='ready';
    }catch{if(request!==generation||RP.state.wallet?.address!==address)return;balanceStatus='error';}
    updateBalance();
  }
  function balanceText(){return balanceStatus==='ready'?balance.toLocaleString('en-US',{maximumFractionDigits:6})+' SOL':balanceStatus==='loading'?'Loading…':'Balance unavailable';}
  function updateBalance(){document.querySelectorAll('[data-live-balance]').forEach(el=>el.textContent=balanceText());}
  function panel(){const w=RP.state.wallet;if(!w||!w.real)return '';return `<section class="wallet-summary"><div><span class="eyebrow">SOLANA MAINNET / LIVE BALANCE</span><strong data-live-balance>${balanceText()}</strong><p class="small-note">${balanceStatus==='error'?'The public RPC may be rate limited. Refresh to retry.':'Your connected wallet’s mainnet SOL balance.'}</p></div><div class="wallet-summary-actions"><button class="button" data-action="refresh-balance">Refresh ↻</button><a class="button" href="https://explorer.solana.com/address/${encodeURIComponent(w.address)}" target="_blank" rel="noopener noreferrer">View on explorer ↗</a><a class="button" href="#profile">Your profile ↗</a></div></section>`;}
  function open(){
    const w=RP.state.wallet;
    if(w){UI.modal(`<div class="modal-body"><div class="modal-top"><h2>${w.real?'Your wallet':'Your profile'}</h2><button class="close-button" data-action="close" aria-label="Close dialog">×</button></div><p class="mono">${w.real?RP.escape(w.provider)+' · SOLANA MAINNET':'RESCUEPAD PROFILE'}</p><p class="wallet-address">${RP.escape(w.address)}</p>${panel()}<div class="modal-actions"><button class="button" data-action="copy-wallet">Copy address</button><button class="button" data-action="disconnect">${w.real?'Disconnect':'Sign out'}</button></div></div>`);return;}
    const found=choices();const names=[...new Set([...Object.keys(links),...found.map(w=>w.name)])];
    UI.modal(`<div class="modal-body" data-wallet-picker><div class="modal-top"><h2>CONNECT</h2><button class="close-button" data-action="close" aria-label="Close dialog">×</button></div><p>Your wallet. Your corner of the internet.</p><p class="small-note">Connect a Solana wallet to create your profile. Approve the connection in your wallet.</p><div class="wallet-options">${names.map(name=>{const installed=found.some(w=>w.name===name);return `<div class="wallet-option"><button class="provider" data-provider="${RP.escape(name)}" ${installed?'':'disabled'}><span class="provider-icon">${name==='Phantom'?'◕':name==='Solflare'?'☀':'▣'}</span><span>${RP.escape(name)}<small>${installed?'Detected · connect':'Not detected'}</small></span><span>↗</span></button>${!installed&&links[name]?`<a class="wallet-install" href="${links[name]}" target="_blank" rel="noopener noreferrer">Get ${name} ↗</a>`:''}</div>`;}).join('')}</div><div class="or-divider"><span>or</span></div><button class="provider profile-login" data-action="profile-login"><span class="provider-icon">✳</span><span>Continue with a RescuePad profile<small>No wallet needed · saved to your database</small></span><span>→</span></button><p class="small-note">Other compatible Solana wallets appear automatically. On mobile, open this site inside your wallet’s browser.</p></div>`);
  }
  return {connect,disconnect,useProfile,open,panel,refreshBalance,balanceText,choices};
})();
