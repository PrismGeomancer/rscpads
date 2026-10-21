// Render deterministic frames; encode with the system ffmpeg. No project dependencies.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/stivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=__dirname;
function soundtrack(){
 const rate=48000,n=rate*10,data=Buffer.alloc(44+n*4);data.write('RIFF');data.writeUInt32LE(36+n*4,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(2,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*4,28);data.writeUInt16LE(4,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(n*4,40);
 const chords=[[220,261.63,329.63],[174.61,220,261.63],[261.63,329.63,392],[196,246.94,293.66]];
 for(let i=0;i<n;i++){const t=i/rate,beat=t%.5,ch=chords[Math.min(3,Math.floor(t/2.5))];let v=0;
  for(let j=0;j<3;j++)v+=.075*Math.sin(2*Math.PI*ch[j]*t)*(1+.12*Math.sin(t*2+j));
  const note=ch[Math.floor(t/.25)%3]*2,env=Math.exp(-14*(t%.25));v+=.12*env*(Math.sin(2*Math.PI*note*t)+.18*Math.sin(4*Math.PI*note*t));
  v+=.22*Math.sin(2*Math.PI*(52*beat+2.5*(1-Math.exp(-22*beat))))*Math.exp(-18*beat);
  v*=Math.min(1,t/.15,(10-t)/.5);const sample=Math.round(Math.max(-1,Math.min(1,v)) * 28000);data.writeInt16LE(sample,44+i*4);data.writeInt16LE(sample,46+i*4);
 }fs.writeFileSync(path.join(dir,'soundtrack.wav'),data);
}
(async()=>{
 soundtrack();const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--allow-file-access-from-files']});
 const page=await browser.newPage({viewport:{width:1080,height:1080},deviceScaleFactor:1});await page.goto('file://'+path.join(dir,'launch.html'));await page.evaluate(()=>window.ready);
 const ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','30','-i','pipe:0','-i',path.join(dir,'soundtrack.wav'),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','10','-movflags','+faststart',path.join(dir,'rescuepad-launch-10s.mp4')],{stdio:['pipe','ignore','pipe']});
 let errors='';ff.stderr.on('data',d=>errors+=d);const done=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('close',code=>code?reject(Error(errors)):resolve());});
 for(let i=0;i<300;i++){const png=Buffer.from(await page.evaluate(t=>drawFrame(t),i/30),'base64');if(!ff.stdin.write(png))await new Promise(r=>ff.stdin.once('drain',r));if(i%60===0)console.log('Rendered',i,'/ 300');}
 ff.stdin.end();await done;
 await page.evaluate(()=>drawFrame(8.7));await page.screenshot({path:path.join(dir,'poster.png')});
 await browser.close();console.log('Created rescuepad-launch-10s.mp4');
})().catch(e=>{console.error(e);process.exit(1)});
