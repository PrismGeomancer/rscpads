// Test-only injected providers; never loaded by the website.
module.exports=function walletFixture(){
  const address='11111111111111111111111111111111';
  const listeners={};
  function provider(){return {publicKey:null,async connect(){this.publicKey={toString:()=>address};return {publicKey:this.publicKey};},async disconnect(){this.publicKey=null;},on(event,fn){(listeners[event]??=[]).push(fn);},removeListener(event,fn){listeners[event]=(listeners[event]||[]).filter(f=>f!==fn);}};}
  window.phantom={solana:provider()};window.solflare=provider();window.backpack=provider();
  window.fetch=async()=>({ok:true,json:async()=>({result:{value:1250000000}})});
};
