import { useState, useRef } from "react";
import SimulatorHeader from "@/components/SimulatorHeader";
import { saveSession } from "@/lib/api";

// ── DATA ──
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const VOISINS_NUMS=new Set([22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25]);
const TIERS_NUMS=new Set([27,13,36,11,30,8,23,10,5,24,16,33]);
const ORPH_NUMS=new Set([17,34,6,1,20,14,31,9]);
const VOISINS_BETS=[{t:"trio",n:[0,2,3],c:2},{t:"cheval",n:[4,7],c:1},{t:"cheval",n:[12,15],c:1},{t:"cheval",n:[18,21],c:1},{t:"cheval",n:[19,22],c:1},{t:"carre",n:[25,26,28,29],c:2},{t:"cheval",n:[32,35],c:1}];
const TIERS_BETS=[{t:"cheval",n:[5,8],c:1},{t:"cheval",n:[10,11],c:1},{t:"cheval",n:[13,16],c:1},{t:"cheval",n:[23,24],c:1},{t:"cheval",n:[27,30],c:1},{t:"cheval",n:[33,36],c:1}];
const ORPH_BETS=[{t:"plein",n:[1],c:1},{t:"cheval",n:[6,9],c:1},{t:"cheval",n:[14,17],c:1},{t:"cheval",n:[17,20],c:1},{t:"cheval",n:[31,34],c:1}];

function genPicture(){
  const row=1+Math.floor(Math.random()*10);
  const col=Math.floor(Math.random()*3);
  const winNum=row*3+(3-col);
  const baseRow=row-1;
  const nums=[];
  for(let r=0;r<3;r++){
    const rr=[];
    for(let c=0;c<3;c++){
      const n=(baseRow+r)*3+(3-c);
      rr.push(n>0&&n<=36?n:null);
    }
    nums.push(rr);
  }
  const wr=1,wc=col;
  const CW=1/3,CH=1/3;
  const cx=(wc+0.5)*CW, cy=(wr+0.5)*CH;
  const allPos=[];
  allPos.push({id:"plein",type:"plein",pay:35,x:cx,y:cy});
  if(wr>0)allPos.push({id:"ch_t",type:"cheval",pay:17,x:cx,y:wr*CH});
  if(wr<2)allPos.push({id:"ch_b",type:"cheval",pay:17,x:cx,y:(wr+1)*CH});
  if(wc>0)allPos.push({id:"ch_l",type:"cheval",pay:17,x:wc*CW,y:cy});
  if(wc<2)allPos.push({id:"ch_r",type:"cheval",pay:17,x:(wc+1)*CW,y:cy});
  if(wr>0&&wc>0)allPos.push({id:"ca_tl",type:"carre",pay:8,x:wc*CW,y:wr*CH});
  if(wr>0&&wc<2)allPos.push({id:"ca_tr",type:"carre",pay:8,x:(wc+1)*CW,y:wr*CH});
  if(wr<2&&wc>0)allPos.push({id:"ca_bl",type:"carre",pay:8,x:wc*CW,y:(wr+1)*CH});
  if(wr<2&&wc<2)allPos.push({id:"ca_br",type:"carre",pay:8,x:(wc+1)*CW,y:(wr+1)*CH});
  allPos.push({id:"trans",type:"transversale",pay:11,x:0,y:cy});
  if(wr>0)allPos.push({id:"six_t",type:"sixain",pay:5,x:0,y:wr*CH});
  if(wr<2)allPos.push({id:"six_b",type:"sixain",pay:5,x:0,y:(wr+1)*CH});
  const count=2+Math.floor(Math.random()*Math.min(8,allPos.length));
  const shuffled=[...allPos];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const picked=shuffled.slice(0,count);
  const chips=picked.map(p=>({...p,stack:1+Math.floor(Math.random()*5)}));
  const pay=chips.reduce((s,c)=>s+c.pay*c.stack,0);
  return{nums,chips,pay,winNum,wr,wc};
}

function genExo(){
  const types=["plein","plein","cheval","cheval","transversale","carre","sixain","rouge","noir","pair","impair","manque","passe","dz1","dz2","dz3","col1","col2","col3"];
  const t=types[Math.floor(Math.random()*types.length)];
  if(t==="plein"){const n=Math.floor(Math.random()*37);return{type:t,key:`${n}`,label:`Plein ${n}`};}
  if(["rouge","noir","pair","impair","manque","passe","dz1","dz2","dz3","col1","col2","col3"].includes(t))return{type:t,key:t,label:{rouge:"Rouge",noir:"Noir",pair:"Pair",impair:"Impair",manque:"Manque",passe:"Passe",dz1:"1ere Douzaine",dz2:"2eme Douzaine",dz3:"3eme Douzaine",col1:"Colonne 1",col2:"Colonne 2",col3:"Colonne 3"}[t]};
  if(t==="cheval"){const ch=[];for(let r=0;r<12;r++)for(let c=0;c<3;c++){const n=r*3+c+1;if(c<2)ch.push([n,n+1]);if(r<11)ch.push([n,n+3]);}ch.push([0,1],[0,2],[0,3]);const p=ch[Math.floor(Math.random()*ch.length)];return{type:t,key:p.join(","),label:`Cheval ${p.join("-")}`,nums:p};}
  if(t==="transversale"){const r=Math.floor(Math.random()*12);const b=r*3+1;return{type:t,key:`${b},${b+1},${b+2}`,label:`Transversale ${b}-${b+2}`,nums:[b,b+1,b+2]};}
  if(t==="carre"){const r=Math.floor(Math.random()*11);const c=Math.floor(Math.random()*2);const n=r*3+c+1;return{type:t,key:[n,n+1,n+3,n+4].join(","),label:`Carre ${n}-${n+4}`,nums:[n,n+1,n+3,n+4]};}
  if(t==="sixain"){const r=Math.floor(Math.random()*11);const b=r*3+1;return{type:t,key:[b,b+1,b+2,b+3,b+4,b+5].join(","),label:`Sixain ${b}-${b+5}`,nums:[b,b+1,b+2,b+3,b+4,b+5]};}
  return{type:"plein",key:"0",label:"Plein 0"};
}

function genHipExo(){
  const sectors=[{name:"Voisins du Zero",bets:VOISINS_BETS},{name:"Tiers du Cylindre",bets:TIERS_BETS},{name:"Orphelins",bets:ORPH_BETS}];
  const s=sectors[Math.floor(Math.random()*3)];const b=s.bets[Math.floor(Math.random()*s.bets.length)];
  const label=b.t==="plein"?`Plein ${b.n[0]}`:b.t==="trio"?`Trio ${b.n.join("-")}`:b.t==="carre"?`Carre ${b.n.join("-")}`:`Cheval ${b.n.join("-")}`;
  return{sectorName:s.name,bet:b,label,key:b.n.sort((a,c)=>a-c).join(",")};
}

// ── MAIN ──
export default function RouletteSimulator(){
  const [screen,setScreen]=useState("menu");
  const [mode,setMode]=useState(1);
  const [stats,setStats]=useState({ok:0,total:0,rounds:0});
  const [exo,setExo]=useState(null);const [wrong,setWrong]=useState(false);const [sel,setSel]=useState(new Set());
  const [hipExo,setHipExo]=useState(null);const [hipWrong,setHipWrong]=useState(false);const [hipSel,setHipSel]=useState(new Set());
  const [pic,setPic]=useState(null);const [picInput,setPicInput]=useState("");const [picWrong,setPicWrong]=useState(false);
  const picRef=useRef(null);

  const start1=()=>{setExo(genExo());setWrong(false);setSel(new Set());setScreen("game");};
  const start2=()=>{setHipExo(genHipExo());setHipWrong(false);setHipSel(new Set());setScreen("game");};
  const start3=()=>{setPic(genPicture());setPicInput("");setPicWrong(false);setScreen("game");setTimeout(()=>picRef.current?.focus(),200);};

  const logRound=(isCorrect,nextStats)=>{saveSession({game_id:"roulette",mode:"guidee",score:isCorrect?100:0,accuracy:nextStats.total>0?Math.round(nextStats.ok/nextStats.total*100):0,duration_seconds:0,rounds_played:1,rounds_correct:isCorrect?1:0,errors:isCorrect?[]:["mauvaise reponse"],details:{mode}}).catch(()=>null);};
  const check=(key)=>{if(key===exo.key){setWrong(false);const ns={ok:stats.ok+1,total:stats.total+1,rounds:stats.rounds+1};setStats(ns);logRound(true,ns);setTimeout(()=>{setExo(genExo());setSel(new Set());setWrong(false);},400);}else{setWrong(true);const ns={ok:stats.ok,total:stats.total+1,rounds:stats.rounds};setStats(ns);logRound(false,ns);setSel(new Set());}};
  const hipCheck=(key)=>{if(key===hipExo.key){setHipWrong(false);const ns={ok:stats.ok+1,total:stats.total+1,rounds:stats.rounds+1};setStats(ns);logRound(true,ns);setTimeout(()=>{setHipExo(genHipExo());setHipSel(new Set());setHipWrong(false);},400);}else{setHipWrong(true);const ns={ok:stats.ok,total:stats.total+1,rounds:stats.rounds};setStats(ns);logRound(false,ns);setHipSel(new Set());}};
  const picSubmit=()=>{const v=parseInt(picInput);if(isNaN(v))return;if(v===pic.pay){const ns={ok:stats.ok+1,total:stats.total+1,rounds:stats.rounds+1};setStats(ns);logRound(true,ns);setPicWrong(false);setPicInput("");setTimeout(()=>{setPic(genPicture());setTimeout(()=>picRef.current?.focus(),100);},400);}else{setPicWrong(true);setPicInput("");const ns={ok:stats.ok,total:stats.total+1,rounds:stats.rounds};setStats(ns);logRound(false,ns);setTimeout(()=>picRef.current?.focus(),100);}};

  const statsText = stats.total>0?`${Math.round(stats.ok/stats.total*100)}% · R${stats.rounds+1}`:`R1`;

  if(screen==="menu")return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Roulette Anglaise" badge="Roulette Anglaise" />
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"82vh",gap:20}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,margin:0}}>Roulette <span style={{color:"#C9A84C",fontStyle:"italic"}}>Anglaise</span></h1>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
          {[{m:1,l:"Tableau"},{m:2,l:"Hippodrome"},{m:3,l:"Picture Bets"}].map(({m,l})=>(
            <div key={m} onClick={()=>setMode(m)} style={{padding:"10px 16px",background:mode===m?"rgba(201,168,76,0.1)":"#141414",border:mode===m?"2px solid #C9A84C":"1px solid rgba(255,255,255,0.05)",borderRadius:4,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:900,color:mode===m?"#C9A84C":"#BFB9AD"}}>{m}</div>
              <div style={{fontSize:7,color:"#BFB9AD",marginTop:1}}>{l}</div>
            </div>))}
        </div>
        <button onClick={()=>mode===1?start1():mode===2?start2():start3()} style={{padding:"12px 36px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Commencer</button>
      </div>
    </div>);

  // ─── EXO 1: TABLEAU ───
  if(mode===1){
    const CW=44,CH=34;
    const ZW=38;
    const COLS=12,ROWS=3;
    const gridW=COLS*CW,gridH=ROWS*CH;
    const colW=28;
    const totalW=ZW+gridW+colW;
    const dotSz=14;

    const grid=[[3,6,9,12,15,18,21,24,27,30,33,36],[2,5,8,11,14,17,20,23,26,29,32,35],[1,4,7,10,13,16,19,22,25,28,31,34]];

    const allDots=[];
    for(let r=0;r<3;r++)for(let c=0;c<12;c++){
      const n=grid[r][c];
      allDots.push({id:`${n}`,type:"plein",x:ZW+c*CW+CW/2,y:r*CH+CH/2,key:`${n}`});
    }
    allDots.push({id:"0",type:"plein",x:ZW/2,y:gridH/2,key:"0"});
    for(let r=0;r<3;r++)for(let c=0;c<11;c++){
      const a=grid[r][c],b=grid[r][c+1];
      allDots.push({id:`ch${a}_${b}`,type:"cheval",x:ZW+(c+1)*CW,y:r*CH+CH/2,key:[a,b].sort((x,y)=>x-y).join(",")});
    }
    for(let r=0;r<2;r++)for(let c=0;c<12;c++){
      const a=grid[r][c],b=grid[r+1][c];
      allDots.push({id:`cv${a}_${b}`,type:"cheval",x:ZW+c*CW+CW/2,y:(r+1)*CH,key:[a,b].sort((x,y)=>x-y).join(",")});
    }
    allDots.push({id:"ch0_1",type:"cheval",x:ZW,y:2*CH+CH/2,key:"0,1"});
    allDots.push({id:"ch0_2",type:"cheval",x:ZW,y:1*CH+CH/2,key:"0,2"});
    allDots.push({id:"ch0_3",type:"cheval",x:ZW,y:0*CH+CH/2,key:"0,3"});
    for(let r=0;r<2;r++)for(let c=0;c<11;c++){
      const a=grid[r][c],b=grid[r][c+1],d=grid[r+1][c],e=grid[r+1][c+1];
      allDots.push({id:`ca${a}`,type:"carre",x:ZW+(c+1)*CW,y:(r+1)*CH,key:[a,b,d,e].sort((x,y)=>x-y).join(",")});
    }
    const transDots=[];
    for(let c=0;c<12;c++){
      const base=c*3+1;
      transDots.push({id:`tr${base}`,type:"transversale",x:ZW+c*CW+CW/2,y:gridH,key:`${base},${base+1},${base+2}`});
    }
    const sixDots=[];
    for(let c=0;c<11;c++){
      const b1=c*3+1,b2=(c+1)*3+1;
      sixDots.push({id:`sx${b1}`,type:"sixain",x:ZW+(c+1)*CW,y:gridH,key:`${b1},${b1+1},${b1+2},${b2},${b2+1},${b2+2}`});
    }

    return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Roulette Anglaise" badge="Roulette · Tableau" stats={statsText} onBackToMenu={()=>setScreen("menu")} />
      <div style={{maxWidth:700,margin:"0 auto",padding:"10px 6px"}}>
        <div style={{textAlign:"center",marginBottom:8}}>
          <span style={{fontSize:14,fontWeight:700,color:"#C9A84C"}}>{exo?.label}</span>
          {wrong&&<span style={{fontSize:14,color:"#C62828",fontWeight:700,marginLeft:8}}>✗</span>}
        </div>
        <div style={{background:"#0B5E2F",borderRadius:6,border:"4px solid #3A2510",boxShadow:"inset 0 0 30px rgba(0,0,0,0.15),0 4px 20px rgba(0,0,0,0.4)",padding:"8px 6px",overflowX:"auto"}}>
          <div style={{position:"relative",width:totalW,height:gridH+dotSz,margin:"0 auto"}}>
            <div style={{position:"absolute",left:0,top:0,width:ZW,height:gridH,background:"#0B7A3E",border:"1.5px solid rgba(201,168,76,0.3)",borderRadius:"3px 0 0 3px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:20,fontWeight:900,color:"#fff"}}>0</span>
            </div>
            {grid.map((row,r)=>row.map((n,c)=>{
              const isR=RED.has(n);
              return(<div key={n} style={{position:"absolute",left:ZW+c*CW,top:r*CH,width:CW,height:CH,background:isR?"#C62828":"#1a1a1a",border:"1px solid rgba(201,168,76,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{n}</span>
              </div>);
            }))}
            {["col3","col2","col1"].map((id,i)=>(
              <div key={id} onClick={()=>check(id)} style={{position:"absolute",left:ZW+gridW,top:i*CH,width:colW,height:CH,background:"#0B5E2F",border:"1px solid rgba(201,168,76,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,fontWeight:700,color:"#fff"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.background="#0B5E2F";}}>2:1</div>
            ))}
            {allDots.map(d=>(
              <div key={d.id} onClick={()=>check(d.key)} style={{position:"absolute",left:d.x-dotSz/2,top:d.y-dotSz/2,width:dotSz,height:dotSz,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",zIndex:5,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(100,180,255,0.25)";e.currentTarget.style.transform="scale(1.3)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.transform="scale(1)";}}/>
            ))}
            {transDots.map(d=>(
              <div key={d.id} onClick={()=>check(d.key)} style={{position:"absolute",left:d.x-dotSz/2,top:d.y-dotSz/2,width:dotSz,height:dotSz,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",zIndex:6,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(76,175,80,0.3)";e.currentTarget.style.transform="scale(1.3)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.transform="scale(1)";}}/>
            ))}
            {sixDots.map(d=>(
              <div key={d.id} onClick={()=>check(d.key)} style={{position:"absolute",left:d.x-dotSz/2,top:d.y-dotSz/2,width:dotSz,height:dotSz,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",zIndex:6,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,193,7,0.3)";e.currentTarget.style.transform="scale(1.3)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.transform="scale(1)";}}/>
            ))}
          </div>
          <div style={{display:"flex",gap:0,marginTop:0,marginLeft:ZW,marginRight:colW}}>
            {[{id:"dz1",l:"1ere 12"},{id:"dz2",l:"2eme 12"},{id:"dz3",l:"3eme 12"}].map(d=>(<div key={d.id} onClick={()=>check(d.id)} style={{flex:1,height:22,background:"#0B5E2F",border:"1px solid rgba(201,168,76,0.15)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,fontWeight:700,color:"#fff"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.12)";}} onMouseLeave={e=>{e.currentTarget.style.background="#0B5E2F";}}>{d.l}</div>))}
          </div>
          <div style={{display:"flex",gap:0,marginTop:0,marginLeft:ZW,marginRight:colW}}>
            {[{id:"manque",l:"1-18"},{id:"pair",l:"PAIR"},{id:"rouge",l:"◆",bg:"#C62828"},{id:"noir",l:"◆",bg:"#1a1a1a"},{id:"impair",l:"IMPAIR"},{id:"passe",l:"19-36"}].map(c=>(<div key={c.id} onClick={()=>check(c.id)} style={{flex:1,height:22,background:c.bg||"#0B5E2F",border:"1px solid rgba(201,168,76,0.15)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,fontWeight:700,color:"#fff"}} onMouseEnter={e=>{e.currentTarget.style.opacity="0.8";}} onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>{c.l}</div>))}
          </div>
        </div>
      </div>
    </div>);
  }

  // ─── EXO 2: HIPPODROME ───
  if(mode===2){
    const ex=hipExo;const hipNeeded=ex?.bet?.n?.length||0;const hipMulti=hipNeeded>1;
    const hipClickNum=(n)=>{if(!hipMulti){hipCheck(`${n}`);return;}const ns=new Set(hipSel);if(ns.has(n))ns.delete(n);else ns.add(n);setHipSel(ns);if(ns.size===hipNeeded){hipCheck([...ns].sort((a,b)=>a-b).join(","));setHipSel(new Set());}};

    const TOP=[10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35];
    const BOT=[30,11,36,13,27,6,34,17,25,2,21,4,19,15,32];
    const C=28;
    const cols=TOP.length;
    const arcW=C*1.8;
    const bodyW=cols*C;
    const totalW=arcW+bodyW+arcW;
    const rowH=C+4;
    const labelH=C+2;
    const topY=0,midY=rowH,botY=rowH+labelH;
    const fullH=botY+rowH;
    const ox=arcW;
    const tiersCols=5,orphCols=5,voisCols=7;

    const HC=({n,x,y,w,h,rad,fs})=>{
      if(n===null||n===undefined)return null;
      const isR=RED.has(n);const isSel2=hipSel.has(n);
      return(<div onClick={()=>hipClickNum(n)} style={{position:"absolute",left:x,top:y,width:w||C,height:h||rowH,borderRadius:rad||0,background:isSel2?"rgba(201,168,76,0.85)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:fs||11,fontWeight:800,color:isSel2?"#0A0A0A":isR?"#E53935":"#E8DCC0",transition:"all 0.15s",zIndex:2,userSelect:"none"}}
        onMouseEnter={e=>{if(!isSel2){e.currentTarget.style.background="rgba(201,168,76,0.18)";e.currentTarget.style.transform="scale(1.08)";}}}
        onMouseLeave={e=>{if(!isSel2){e.currentTarget.style.background="transparent";e.currentTarget.style.transform="scale(1)";}}}>{n}</div>);
    };

    const g1="rgba(186,155,70,0.6)";
    const g2="rgba(186,155,70,0.25)";
    const g3="rgba(186,155,70,0.12)";

    return(
      <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
        <SimulatorHeader title="Roulette Anglaise" badge="Roulette · Hippodrome" stats={statsText} onBackToMenu={()=>setScreen("menu")} />
        <div style={{maxWidth:640,margin:"0 auto",padding:"12px 6px"}}>
          <div style={{textAlign:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:"#C9A84C"}}>{ex?.sectorName}</div>
            <div style={{fontSize:11,color:"#BFB9AD",marginTop:3}}>{ex?.label} <span style={{color:"#888"}}>({ex?.bet?.c} jeton{ex?.bet?.c>1?"s":""})</span></div>
            {hipWrong&&<div style={{fontSize:14,color:"#C62828",fontWeight:700,marginTop:4}}>✗</div>}
          </div>
          <div style={{background:"linear-gradient(170deg,#1A6840,#165C38 40%,#125030)",borderRadius:10,border:"4px solid #2E1C0C",boxShadow:"0 8px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.02)",padding:"12px 10px",overflowX:"auto"}}>
            <div style={{position:"relative",width:totalW,height:fullH,margin:"0 auto"}}>
              <svg width={totalW} height={fullH} style={{position:"absolute",inset:0,zIndex:1,pointerEvents:"none"}}>
                <path d={`M${ox} ${topY+1} Q${ox-arcW*0.9} ${topY+1} ${ox-arcW*0.9} ${fullH/2} Q${ox-arcW*0.9} ${botY+rowH-1} ${ox} ${botY+rowH-1}`} fill="none" stroke={g1} strokeWidth="1.5"/>
                <path d={`M${ox} ${midY} Q${ox-arcW*0.3} ${midY} ${ox-arcW*0.3} ${(midY+botY)/2} Q${ox-arcW*0.3} ${botY} ${ox} ${botY}`} fill="none" stroke={g1} strokeWidth="1"/>
                <line x1={ox-arcW*0.9} y1={midY} x2={ox} y2={midY} stroke={g2} strokeWidth="0.7"/>
                <line x1={ox-arcW*0.9} y1={botY} x2={ox} y2={botY} stroke={g2} strokeWidth="0.7"/>
                <path d={`M${ox+bodyW} ${topY+1} Q${ox+bodyW+arcW*0.9} ${topY+1} ${ox+bodyW+arcW*0.9} ${fullH/2} Q${ox+bodyW+arcW*0.9} ${botY+rowH-1} ${ox+bodyW} ${botY+rowH-1}`} fill="none" stroke={g1} strokeWidth="1.5"/>
                <path d={`M${ox+bodyW} ${midY} Q${ox+bodyW+arcW*0.3} ${midY} ${ox+bodyW+arcW*0.3} ${(midY+botY)/2} Q${ox+bodyW+arcW*0.3} ${botY} ${ox+bodyW} ${botY}`} fill="none" stroke={g1} strokeWidth="1"/>
                <line x1={ox+bodyW} y1={midY} x2={ox+bodyW+arcW*0.9} y2={midY} stroke={g2} strokeWidth="0.7"/>
                <line x1={ox+bodyW} y1={botY} x2={ox+bodyW+arcW*0.9} y2={botY} stroke={g2} strokeWidth="0.7"/>
                {[0.33,0.66].map((f,i)=><line key={`rf${i}`} x1={ox+bodyW+4} y1={midY+(botY-midY)*f} x2={ox+bodyW+arcW*0.85} y2={midY+(botY-midY)*f} stroke={g3} strokeWidth="0.5"/>)}
                <line x1={ox} y1={topY} x2={ox+bodyW} y2={topY} stroke={g1} strokeWidth="1.8"/>
                <line x1={ox} y1={midY} x2={ox+bodyW} y2={midY} stroke={g1} strokeWidth="1.2"/>
                <line x1={ox} y1={botY} x2={ox+bodyW} y2={botY} stroke={g1} strokeWidth="1.2"/>
                <line x1={ox} y1={botY+rowH} x2={ox+bodyW} y2={botY+rowH} stroke={g1} strokeWidth="1.8"/>
                <line x1={ox} y1={topY} x2={ox} y2={botY+rowH} stroke={g1} strokeWidth="1.8"/>
                <line x1={ox+bodyW} y1={topY} x2={ox+bodyW} y2={botY+rowH} stroke={g1} strokeWidth="1.8"/>
                {TOP.map((_,i)=>{if(!i)return null;return <line key={`td${i}`} x1={ox+i*C} y1={topY+1} x2={ox+i*C} y2={midY-1} stroke={g2} strokeWidth="0.6"/>;})}
                {BOT.map((_,i)=>{if(!i)return null;return <line key={`bd${i}`} x1={ox+i*C} y1={botY+1} x2={ox+i*C} y2={botY+rowH-1} stroke={g2} strokeWidth="0.6"/>;})}
                <line x1={ox+tiersCols*C} y1={midY} x2={ox+tiersCols*C} y2={botY} stroke={g1} strokeWidth="1.2"/>
                <line x1={ox+(tiersCols+orphCols)*C} y1={midY} x2={ox+(tiersCols+orphCols)*C} y2={botY} stroke={g1} strokeWidth="1.2"/>
              </svg>
              <HC n={8} x={1} y={topY} w={arcW-2} h={midY-topY} fs={12} rad="8px 0 0 0"/>
              <HC n={23} x={1} y={botY} w={arcW-2} h={rowH} fs={12} rad="0 0 0 8px"/>
              {TOP.map((n,i)=><HC key={`t${n}`} n={n} x={ox+i*C} y={topY} w={C} h={rowH}/>)}
              {BOT.map((n,i)=><HC key={`b${n}`} n={n} x={ox+i*C} y={botY} w={C} h={rowH}/>)}
              <HC n={3} x={ox+bodyW+3} y={topY} w={arcW-6} h={midY-topY} fs={11} rad="0 8px 0 0"/>
              <HC n={26} x={ox+bodyW+3} y={midY+1} w={arcW-6} h={botY-midY-2} fs={12}/>
              <HC n={0} x={ox+bodyW+3} y={botY} w={arcW-6} h={rowH} fs={11} rad="0 0 8px 0"/>
              <div style={{position:"absolute",left:ox,top:midY,width:tiersCols*C,height:labelH,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",background:"rgba(0,0,0,0.06)"}}>
                <span style={{fontSize:10,fontWeight:800,color:"rgba(186,155,70,0.35)",letterSpacing:"0.15em",fontFamily:"'Playfair Display',serif"}}>TIERS</span>
              </div>
              <div style={{position:"absolute",left:ox+tiersCols*C,top:midY,width:orphCols*C,height:labelH,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",background:"rgba(0,0,0,0.06)"}}>
                <span style={{fontSize:9,fontWeight:800,color:"rgba(186,155,70,0.35)",letterSpacing:"0.1em",fontFamily:"'Playfair Display',serif"}}>ORPHELINS</span>
              </div>
              <div style={{position:"absolute",left:ox+(tiersCols+orphCols)*C,top:midY,width:voisCols*C,height:labelH,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",background:"rgba(0,0,0,0.06)"}}>
                <span style={{fontSize:7.5,fontWeight:800,color:"rgba(186,155,70,0.35)",letterSpacing:"0.08em",fontFamily:"'Playfair Display',serif"}}>VOISINS DU ZERO</span>
              </div>
            </div>
          </div>
          {hipMulti&&hipSel.size>0&&<div style={{textAlign:"center",marginTop:6,fontSize:10,color:"#BFB9AD"}}>Selection : {[...hipSel].sort((a,b)=>a-b).join(", ")}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginTop:10,fontSize:8,color:"#BFB9AD"}}>
            <div style={{background:"#141414",borderRadius:4,padding:8}}><div style={{fontWeight:700,color:"#C9A84C",marginBottom:3,fontSize:9}}>Voisins (9j)</div><div style={{lineHeight:1.5}}>Trio 0-2-3 (x2) · Ch 4/7 · 12/15 · 18/21 · 19/22 · 32/35 · Carre 25-29 (x2)</div></div>
            <div style={{background:"#141414",borderRadius:4,padding:8}}><div style={{fontWeight:700,color:"#C9A84C",marginBottom:3,fontSize:9}}>Tiers (6j)</div><div style={{lineHeight:1.5}}>Ch 5/8 · 10/11 · 13/16 · 23/24 · 27/30 · 33/36</div></div>
            <div style={{background:"#141414",borderRadius:4,padding:8}}><div style={{fontWeight:700,color:"#C9A84C",marginBottom:3,fontSize:9}}>Orphelins (5j)</div><div style={{lineHeight:1.5}}>Plein 1 · Ch 6/9 · 14/17 · 17/20 · 31/34</div></div>
          </div>
        </div>
      </div>);
  }

  // ─── EXO 3: PICTURE BETS ───
  if(mode===3&&pic){
    const CW=74,CH=58;
    const ML=20;
    const GW=CW*3+ML,GH=CH*3;
    const Chip=({x,y,stack})=>{
      const sz=28;
      return(
        <div style={{position:"absolute",left:x-sz/2,top:y-sz/2,width:sz,height:sz,borderRadius:"50%",zIndex:10}}>
          <div style={{position:"absolute",bottom:-2,left:2,right:2,height:6,borderRadius:"50%",background:"rgba(0,0,0,0.3)",filter:"blur(3px)"}}/>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"radial-gradient(circle at 40% 32%,#F4A830,#D4880A 45%,#B06A00 75%,#8A5200)",border:"2px solid rgba(255,200,100,0.25)",boxShadow:"inset 0 2px 4px rgba(255,230,180,0.25),inset 0 -2px 3px rgba(0,0,0,0.35),0 3px 10px rgba(0,0,0,0.4)",overflow:"hidden"}}>
            {[0,45,90,135,180,225,270,315].map(a=>{const rd=a*Math.PI/180;return(
              <div key={a} style={{position:"absolute",left:sz/2-1+Math.cos(rd)*(sz/2-2),top:sz/2-1+Math.sin(rd)*(sz/2-2),width:3,height:2,borderRadius:1,background:"rgba(255,255,255,0.3)",transform:`rotate(${a}deg)`}}/>
            );})}
            <div style={{position:"absolute",inset:5,borderRadius:"50%",border:"1.5px solid rgba(255,220,150,0.2)"}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:stack>=10?10:12,fontWeight:900,color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.6)"}}>{stack}</span>
            </div>
            <div style={{position:"absolute",top:2,left:"18%",width:"40%",height:"22%",borderRadius:"50%",background:"linear-gradient(180deg,rgba(255,255,255,0.25),rgba(255,255,255,0))"}}/>
          </div>
        </div>
      );
    };

    return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Roulette Anglaise" badge="Roulette · Picture Bets" stats={statsText} onBackToMenu={()=>setScreen("menu")} />
      <div style={{maxWidth:500,margin:"0 auto",padding:"16px 12px",textAlign:"center"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}}>Quel est le paiement ?</div>
        <div style={{display:"inline-block",perspective:1000,marginBottom:14}}>
          <div style={{transform:"rotateX(22deg)",transformStyle:"preserve-3d",display:"inline-block"}}>
            <div style={{background:"#14663A",borderRadius:4,border:"4px solid #3A2510",boxShadow:"0 30px 70px rgba(0,0,0,0.55),0 8px 20px rgba(0,0,0,0.3),inset 0 0 20px rgba(0,0,0,0.08)",position:"relative",width:GW,height:GH}}>
              {[0,1,2,3].map(i=><div key={`vl${i}`} style={{position:"absolute",left:ML+i*CW,top:0,width:2,height:GH,background:"#C9A84C",opacity:0.5}}/>)}
              {[0,1,2,3].map(i=><div key={`hl${i}`} style={{position:"absolute",left:ML,top:i*CH,width:CW*3,height:2,background:"#C9A84C",opacity:0.5}}/>)}
              <div style={{position:"absolute",left:ML,top:0,width:2,height:GH,background:"#C9A84C",opacity:0.7}}/>
              {pic.nums.map((row,r)=>row.map((n,c)=>{
                if(!n)return null;
                const isR=RED.has(n);
                const isWin=n===pic.winNum;
                return(<div key={`num${r}${c}`} style={{position:"absolute",left:ML+c*CW,top:r*CH,width:CW,height:CH,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:20,fontWeight:900,color:isR?"#E53935":"#F5F0E8",opacity:isWin?1:0.35,textShadow:isWin?"0 0 8px rgba(255,255,255,0.2)":"none"}}>{n}</span>
                </div>);
              }))}
              {pic.chips.map(chip=>{
                const px=ML+chip.x*CW*3;
                const py=chip.y*GH;
                return <Chip key={chip.id} x={px} y={py} stack={chip.stack}/>;
              })}
            </div>
          </div>
        </div>
        <div style={{maxWidth:320,margin:"0 auto"}}>
          {picWrong&&<div style={{fontSize:12,color:"#C62828",fontWeight:700,marginBottom:6}}>✗</div>}
          <div style={{display:"flex",gap:6}}>
            <input ref={picRef} type="number" value={picInput} onChange={e=>setPicInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&picInput.trim()&&picSubmit()} placeholder="Paiement" style={{flex:1,padding:"10px 14px",background:"#0a0a0a",border:"1px solid rgba(201,168,76,0.2)",borderRadius:4,color:"#F5F0E8",fontSize:20,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center"}} autoFocus/>
            <button onClick={()=>picInput.trim()&&picSubmit()} style={{padding:"10px 24px",background:picInput.trim()?"#C9A84C":"#333",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,cursor:picInput.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>OK</button>
          </div>
        </div>
        <div style={{marginTop:12,display:"flex",gap:10,justifyContent:"center",fontSize:8,color:"#666"}}>
          <span>Plein 35</span><span>Cheval 17</span><span>Transv. 11</span><span>Carre 8</span><span>Sixain 5</span>
        </div>
      </div>
    </div>);
  }

  return null;
}
