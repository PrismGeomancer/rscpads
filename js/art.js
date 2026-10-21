// Original, locally drawn pixel illustrations. Fictional characters only.
window.Art = (() => {
  const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  function animal(kind,color,accessory){
    let s='';const ink='#272822',cream='#fff0c7';
    if(kind==='paw') return `<path fill="${color}" d="M27 51h10V39h8V27h9v-8h8v8h9v12h9v12h10v24H80v9H37v-9H27z"/>${rect(32,22,12,17,color)}${rect(49,10,12,19,color)}${rect(67,11,12,18,color)}${rect(83,25,12,17,color)}${rect(43,90,35,7,ink)}`;
    if(kind==='cat')s+=`<path fill="${ink}" d="M24 54V20h9l16 14h23l14-14h10v51H24z"/><path fill="${color}" d="M30 47V29l17 13h25l17-13v43H30z"/>`;
    else s+=rect(27,35,65,41,ink)+rect(20,31,19,45,ink)+rect(84,32,18,43,ink)+rect(27,36,11,31,'#846047')+rect(85,37,10,30,'#846047')+rect(38,31,45,47,color)+rect(45,24,32,8,color);
    s+=rect(36,73,50,21,color)+rect(44,70,34,16,cream)+rect(54,68,14,9,ink)+rect(58,78,6,8,ink)+rect(44,95,12,10,color)+rect(73,95,12,10,color);
    if(accessory==='glasses')s+=rect(33,47,56,5,ink)+rect(36,49,21,14,ink)+rect(64,49,21,14,ink)+rect(39,50,7,3,'#eff1df')+rect(68,50,7,3,'#eff1df');
    else s+=rect(43,52,9,10,ink)+rect(70,52,9,10,ink)+rect(44,52,3,3,'#fff')+rect(71,52,3,3,'#fff');
    if(accessory==='desk')s+=rect(10,88,104,9,'#614939')+rect(73,65,33,24,'#252d2b')+rect(77,69,25,16,'#bbd98a')+`<path d="M79 81l5-5 4 3 7-7" fill="none" stroke="${ink}" stroke-width="2"/>`;
    if(accessory==='rocket')s+=`<path d="M17 101V73l10-13 9 13v28z" fill="#bb9774"/>${rect(24,77,7,11,'#e2e8cd')}${rect(21,100,11,9,'#ff955a')}`;
    if(accessory==='peanut')s+=`<path d="M25 86L16 72V47l8-12h10v40h55V35h11l8 12v25l-10 14-6 25H30z" fill="#bb9151" stroke="${ink}" stroke-width="3"/><path d="M23 46v24m78-24v24M33 97h53" stroke="#e0b973" stroke-width="4"/>`;
    if(accessory==='hat')s+=rect(27,29,70,7,'#bbd98a')+rect(44,14,35,15,'#bbd98a');
    if(accessory==='halo')s+=`<ellipse cx="61" cy="15" rx="23" ry="6" fill="none" stroke="#fff3a1" stroke-width="4"/>`;
    if(accessory==='space')s+=`<circle cx="60" cy="59" r="49" stroke="#e4eceb" stroke-width="4" fill="none"/>`;
    if(accessory==='bread')s+=rect(29,87,66,25,'#c19a60')+rect(36,92,52,14,'#edd89d');
    return s;
  }
  function token(t){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" shape-rendering="crispEdges"><rect width="120" height="120" fill="${t.bg}"/>${rect(9,12,5,5,'#ffffff45')}${rect(101,22,7,7,'#ffffff45')}${rect(12,88,4,4,'#ffffff45')}${animal(t.kind,t.color,t.accessory)}</svg>`;}
  function rescue(r){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" shape-rendering="crispEdges"><rect width="360" height="160" fill="${r.color}"/><circle cx="285" cy="35" r="19" fill="#f0e5ba"/><path d="M0 126l70-46 65 21 65-48 76 55 84-27v79H0" fill="#586f623b"/>${r.art==='city'?'<path d="M16 108V65h30v43h9V39h29v69h15V73h28v35" fill="#414e4433"/>':'<path d="M0 135h360v25H0" fill="#55685655"/>'}<g transform="translate(120 21) scale(1.1)">${animal(r.art==='cat'?'cat':'dog','#eee1bd','')}</g></svg>`;}
  const uri=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
  return {token,rescue,uri,animal};
})();
