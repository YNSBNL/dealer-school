import { useState, useRef, useEffect } from "react";
import SimulatorHeader from "@/components/SimulatorHeader";

// ── ENGINE ──
const SUITS=["♠","♥","♦","♣"],SC={"♠":"#1a1a1a","♥":"#C62828","♦":"#C62828","♣":"#1a1a1a"};
const RANKS=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function mkShoe(){const d=[];for(let x=0;x<8;x++)for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,id:`${r}${s}${x}${Math.random()}`});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function bv(c){if(["10","J","Q","K"].includes(c.rank))return 0;if(c.rank==="A")return 1;return parseInt(c.rank);}
function hs(cards){return cards.reduce((s,c)=>s+bv(c),0)%10;}
function playerDraws(ps){return ps<=5;}
function bankerDraws(bs,p3){
  if(p3===null)return bs<=5;
  const v=bv(p3);
  if(bs<=2)return true;
  if(bs===3)return v!==8;
  if(bs===4)return v>=2&&v<=7;
  if(bs===5)return v>=4&&v<=7;
  if(bs===6)return v===6||v===7;
  return false;
}

function resolve(pc,bc,shoe){
  let s=[...shoe],p=[...pc],b=[...bc],p3=null,b3=null;
  const ps=hs(p),bs=hs(b),nat=ps>=8||bs>=8;
  if(!nat){
    if(playerDraws(ps)){p3=s[0];s=s.slice(1);p=[...p,p3];}
    if(bankerDraws(bs,p3)){b3=s[0];s=s.slice(1);b=[...b,b3];}
  }
  const fp=hs(p),fb=hs(b);
  return{fp:p,fb:b,p3,b3,fps:fp,fbs:fb,result:fp>fb?"player":fb>fp?"banker":"tie",nat,pDrew:p3!==null,bDrew:b3!==null,shoe:s};
}

// ── CARD ──
function Card({card,faceDown=false,size="md"}){
  const S={sm:{w:42,h:60,r:5,fi:12,si:10,ci:18,p:"3px"},md:{w:56,h:80,r:6,fi:16,si:13,ci:24,p:"4px 5px"},lg:{w:66,h:94,r:7,fi:19,si:15,ci:28,p:"5px 6px"}};
  const z=S[size]||S.md;
  if(faceDown)return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"linear-gradient(150deg,#8B1A1A,#5C0E0E 60%,#3D0808)",border:"1.5px solid rgba(201,168,76,0.45)",boxShadow:"0 4px 16px rgba(0,0,0,0.5)",flexShrink:0,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:3,borderRadius:z.r-1,border:"1px solid rgba(201,168,76,0.18)",background:"repeating-conic-gradient(rgba(201,168,76,0.04) 0% 25%,transparent 0% 50%) 0 0/6px 6px"}}/></div>);
  const col=SC[card.suit];
  return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"#fff",color:col,border:"1.5px solid #bbb",padding:z.p,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 3px 12px rgba(0,0,0,0.2),0 1px 2px rgba(0,0,0,0.1)",fontFamily:"'Playfair Display',serif",flexShrink:0,position:"relative"}}><div style={{lineHeight:1,display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div><div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:z.ci,lineHeight:1}}>{card.suit}</div><div style={{lineHeight:1,alignSelf:"flex-end",transform:"rotate(180deg)",display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div></div>);
}

// ── THIRD CARD TABLE ──
function ThirdCardTable(){
  return(
    <div style={{fontSize:10,color:"#BFB9AD",lineHeight:1.6}}>
      <div style={{fontWeight:700,color:"#4FC3F7",marginBottom:4}}>Player :</div>
      <div style={{marginBottom:6}}>0-5 → Carte · Reste · 8-9 → Naturel</div>
      <div style={{fontWeight:700,color:"#EF5350",marginBottom:4}}>Banker (si Player a tiré) :</div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"1px 10px",fontSize:9}}>
        <span style={{fontWeight:600}}>0-2</span><span>Tire toujours</span>
        <span style={{fontWeight:600}}>3</span><span>Tire sauf si P3 = 8</span>
        <span style={{fontWeight:600}}>4</span><span>Tire si P3 = 2-7</span>
        <span style={{fontWeight:600}}>5</span><span>Tire si P3 = 4-7</span>
        <span style={{fontWeight:600}}>6</span><span>Tire si P3 = 6-7</span>
        <span style={{fontWeight:600}}>7</span><span>Reste</span>
      </div>
      <div style={{marginTop:6,fontWeight:700,color:"#EF5350"}}>Banker (si Player reste) :</div>
      <div>0-5 → Carte · 6-7 → Reste</div>
    </div>
  );
}

// ── MAIN ──
export default function BaccaratSimulator(){
  const [screen,setScreen]=useState("menu");
  const [diff,setDiff]=useState(1);
  const [shoe,setShoe]=useState([]);
  const [playerCards,setPlayerCards]=useState([]);
  const [bankerCards,setBankerCards]=useState([]);
  const [phase,setPhase]=useState("idle");
  const [step,setStep]=useState("idle");
  const [resolution,setResolution]=useState(null);
  const [wrong,setWrong]=useState(false);
  const [stats,setStats]=useState({rounds:0,ok:0,total:0});
  const [p3Shown,setP3Shown]=useState(false);
  const [b3Shown,setB3Shown]=useState(false);
  const [l2Num,setL2Num]=useState(0);
  const [l2Input,setL2Input]=useState("");
  const [l2Comp,setL2Comp]=useState(false);
  const [l2Timer,setL2Timer]=useState(7);
  const [l2TimeLeft,setL2TimeLeft]=useState(0);
  const [l2Round,setL2Round]=useState(0);
  const [l2Errors,setL2Errors]=useState([]);
  const [l2Done,setL2Done]=useState(false);
  const l2Ref=useRef(null);
  const l2TimerRef=useRef(null);
  const [winnerWrong,setWinnerWrong]=useState(false);

  const dealHand=()=>{
    const s=shoe.length>20?shoe:mkShoe();
    const pc=[s[0],s[2]];const bc=[s[1],s[3]];const rest=s.slice(4);
    const res=resolve(pc,bc,rest);
    setShoe(rest);setPlayerCards(pc);setBankerCards(bc);
    setResolution(res);setWrong(false);setP3Shown(false);setB3Shown(false);setWinnerWrong(false);
    setStep("playerDraw");setPhase("l1");
  };

  const answerPlayer=(action)=>{
    const res=resolution;const shouldDraw=res.pDrew;
    const ok=(action==="carte"&&shouldDraw)||(action==="reste"&&!shouldDraw);
    if(ok){setWrong(false);setStats(s=>({...s,ok:s.ok+1,total:s.total+1}));if(shouldDraw){setPlayerCards(res.fp.slice(0,3));setP3Shown(true);}setStep("bankerDraw");}
    else{setWrong(true);setStats(s=>({...s,total:s.total+1}));}
  };
  const answerBanker=(action)=>{
    const res=resolution;const shouldDraw=res.bDrew;
    const ok=(action==="carte"&&shouldDraw)||(action==="reste"&&!shouldDraw);
    if(ok){setWrong(false);setStats(s=>({...s,ok:s.ok+1,total:s.total+1}));if(shouldDraw){setBankerCards(res.fb.slice(0,3));setB3Shown(true);}setStep("winner");setWinnerWrong(false);}
    else{setWrong(true);setStats(s=>({...s,total:s.total+1}));}
  };
  const answerWinner=(answer)=>{
    const ok=answer===resolution.result;
    if(ok){setWinnerWrong(false);setStats(s=>({...s,ok:s.ok+1,total:s.total+1,rounds:s.rounds+1}));setStep("done");setTimeout(()=>dealHand(),1500);}
    else{setWinnerWrong(true);setStats(s=>({...s,total:s.total+1}));}
  };

  // ── LEVEL 2: Calcul Égalité (x8) ──
  const genL2=()=>(Math.floor(Math.random()*24)+1)*20;
  const startL2=()=>{const n=genL2();setL2Num(n);setL2Input("");setL2Round(1);setL2Errors([]);setL2Done(false);setL2Comp(false);setPhase("l2");setTimeout(()=>l2Ref.current?.focus(),100);};
  const startL2Comp=(t)=>{setL2Comp(true);setL2Timer(t);const n=genL2();setL2Num(n);setL2Input("");setL2Round(1);setL2Errors([]);setL2Done(false);setL2TimeLeft(t);setPhase("l2");setTimeout(()=>l2Ref.current?.focus(),100);};

  useEffect(()=>{
    if(phase!=="l2"||!l2Comp||l2Done)return;
    if(l2TimerRef.current)clearInterval(l2TimerRef.current);
    l2TimerRef.current=setInterval(()=>{
      setL2TimeLeft(t=>{
        if(t<=1){
          setL2Errors(e=>[...e,{num:l2Num,expected:l2Num*8,given:"⏱"}]);
          setStats(s=>({...s,total:s.total+1}));
          if(l2Round>=50){setL2Done(true);clearInterval(l2TimerRef.current);return 0;}
          const nn=genL2();setL2Num(nn);setL2Input("");setL2Round(r=>r+1);
          setTimeout(()=>l2Ref.current?.focus(),50);
          return l2Timer;
        }
        return t-1;
      });
    },1000);
    return ()=>clearInterval(l2TimerRef.current);
  },[phase,l2Comp,l2Done,l2Num,l2Round]);

  const submitL2=()=>{
    const v=parseInt(l2Input);const expected=l2Num*8;const ok=v===expected;
    setStats(s=>({...s,ok:s.ok+(ok?1:0),total:s.total+1}));
    if(!ok){
      if(l2Comp){
        setL2Errors(e=>[...e,{num:l2Num,expected,given:v||"?"}]);
        if(l2Round>=50){setL2Done(true);if(l2TimerRef.current)clearInterval(l2TimerRef.current);return;}
        const nn=genL2();setL2Num(nn);setL2Input("");setL2Round(r=>r+1);setL2TimeLeft(l2Timer);
      }else{
        setL2Input("");
      }
      setTimeout(()=>l2Ref.current?.focus(),50);
      return;
    }
    if(l2Comp&&l2Round>=50){setL2Done(true);if(l2TimerRef.current)clearInterval(l2TimerRef.current);return;}
    const nn=genL2();setL2Num(nn);setL2Input("");
    if(l2Comp){setL2Round(r=>r+1);setL2TimeLeft(l2Timer);}else setL2Round(r=>r+1);
    setTimeout(()=>l2Ref.current?.focus(),50);
  };

  // ── MENU ──
  if(screen==="menu")return(
    <div className="cp-sim-shell cp-sim-page">
      <div style={{position:"fixed",inset:0,opacity:0.02,pointerEvents:"none",zIndex:9999,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>
      <SimulatorHeader title="Punto Banco" badge="Punto Banco" />
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"82vh",gap:24,padding:"0 16px"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>Dealer School</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,lineHeight:1.15,margin:0}}>
            Punto <span style={{color:"#C9A84C",fontStyle:"italic"}}>Banco</span>
          </h1>
        </div>
        <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.08)",borderRadius:6,padding:16,maxWidth:400,width:"100%"}}>
          <ThirdCardTable/>
        </div>
        <div>
          <div style={{textAlign:"center",fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#BFB9AD",marginBottom:5}}>Niveau</div>
          <div style={{display:"flex",gap:6}}>
            {[{d:1,l:"Tirage"},{d:2,l:"Calcul Égalité"}].map(({d,l})=>(
              <div key={d} onClick={()=>setDiff(d)} style={{padding:"8px 20px",background:diff===d?"rgba(201,168,76,0.1)":"#141414",border:diff===d?"2px solid #C9A84C":"1px solid rgba(255,255,255,0.05)",borderRadius:4,cursor:"pointer",textAlign:"center"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:900,color:diff===d?"#C9A84C":"#BFB9AD"}}>{d}</div>
                <div style={{fontSize:8,color:"#BFB9AD",marginTop:1}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=>{setScreen("game");if(diff===1){setShoe(mkShoe());setTimeout(()=>dealHand(),100);}else{setTimeout(()=>startL2(),50);}}} style={{padding:"12px 36px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          Commencer
        </button>
      </div>
    </div>
  );

  // ── L2: Calcul Égalité ──
  if(phase==="l2")return(
    <div className="cp-sim-shell cp-sim-page">
      <SimulatorHeader title="Punto Banco" badge="Punto Banco · Calcul Egalite" stats={stats.total>0?`${Math.round(stats.ok/stats.total*100)}%`:null} onBackToMenu={()=>{setScreen("menu");setPhase("idle");if(l2TimerRef.current)clearInterval(l2TimerRef.current);}} />
      <div style={{maxWidth:500,margin:"0 auto",padding:"40px 16px",textAlign:"center"}}>
        {!l2Done?(
          <>
            {l2Comp&&<div style={{fontSize:10,fontWeight:700,color:"#C9A84C",marginBottom:6}}>Compétition · {l2Round}/50 · ⏱ {l2TimeLeft}s</div>}
            {!l2Comp&&<div style={{fontSize:10,fontWeight:700,color:"#C9A84C",marginBottom:6}}>Calcule à 8 (paiement égalité)</div>}
            <div style={{background:"radial-gradient(ellipse,#1A6B4F,#0F3D1F)",borderRadius:16,padding:"40px 24px",border:"3px solid rgba(201,168,76,0.15)",marginBottom:20}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:900,color:"#F5F0E8"}}>{l2Num}€</div>
              <div style={{fontSize:11,color:"rgba(201,168,76,0.5)",marginTop:4}}>× 8 = ?</div>
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>
              <input ref={l2Ref} type="number" value={l2Input} onChange={e=>setL2Input(e.target.value)} onKeyDown={e=>e.key==="Enter"&&l2Input.trim()&&submitL2()} placeholder="Résultat" style={{width:160,padding:"10px 14px",background:"#0a0a0a",border:"1px solid rgba(201,168,76,0.2)",borderRadius:4,color:"#F5F0E8",fontSize:20,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center"}} autoFocus/>
              <button onClick={()=>l2Input.trim()&&submitL2()} disabled={!l2Input.trim()} style={{padding:"10px 24px",background:l2Input.trim()?"#C9A84C":"#333",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,cursor:l2Input.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>OK</button>
            </div>
            {!l2Comp&&(
              <div style={{marginTop:24,borderTop:"1px solid rgba(201,168,76,0.08)",paddingTop:16}}>
                <div style={{fontSize:9,fontWeight:700,color:"#BFB9AD",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Mode Compétition</div>
                <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  {[5,7,10].map(t=>(<button key={t} onClick={()=>startL2Comp(t)} style={{padding:"8px 18px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:3,color:"#C9A84C",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t}s · 50 rounds</button>))}
                </div>
              </div>
            )}
          </>
        ):(
          <div>
            <div style={{fontSize:16,fontWeight:900,fontFamily:"'Playfair Display',serif",color:"#C9A84C",marginBottom:12}}>Récapitulatif</div>
            <div style={{fontSize:13,color:"#BFB9AD",marginBottom:16}}>{50-l2Errors.length}/50 corrects · {l2Errors.length} erreurs</div>
            {l2Errors.length>0&&(
              <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.08)",borderRadius:6,padding:12,maxHeight:300,overflowY:"auto",textAlign:"left"}}>
                {l2Errors.map((e,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",fontSize:11,color:"#BFB9AD"}}><span>{e.num}€ × 8</span><span style={{color:"#C62828"}}>{e.given} <span style={{color:"#888"}}>→</span> <span style={{color:"#2E7D46"}}>{e.expected}€</span></span></div>))}
              </div>
            )}
            <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:16}}>
              <button onClick={()=>startL2Comp(l2Timer)} style={{padding:"9px 24px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Recommencer</button>
              <button onClick={startL2} style={{padding:"9px 24px",background:"transparent",color:"#BFB9AD",border:"1px solid rgba(255,255,255,0.08)",borderRadius:3,fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Mode libre</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── GAME ──
  const res=resolution;
  const isDone=step==="done";

  return(
    <div className="cp-sim-shell cp-sim-page">
      <SimulatorHeader title="Punto Banco" badge="Punto Banco · Tirage" stats={`R${stats.rounds+1}${stats.total>0?` · ${Math.round(stats.ok/stats.total*100)}%`:""}`} onBackToMenu={()=>{setScreen("menu");setPhase("idle");}} />

      <div style={{maxWidth:700,margin:"0 auto",padding:"24px 16px"}}>
        <div style={{background:"radial-gradient(ellipse 120% 80% at 50% 50%,#1A6B4F,#15553A 40%,#0F3D1F 80%,#0B3320)",borderRadius:16,padding:"28px 32px",border:"4px solid rgba(201,168,76,0.18)",boxShadow:"inset 0 0 100px rgba(0,0,0,0.2),0 16px 50px rgba(0,0,0,0.45)",position:"relative"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:14,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(201,168,76,0.03)",fontFamily:"'Playfair Display',serif",whiteSpace:"nowrap",pointerEvents:"none"}}>PUNTO BANCO</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32}}>
            <div style={{padding:16,borderRadius:12,border:"2px solid transparent",background:"transparent",transition:"all 0.3s"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#EF5350",marginBottom:10,textAlign:"center"}}>Banco</div>
              <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                {bankerCards.map(c=><Card key={c.id} card={c} size="md"/>)}
              </div>
            </div>

            <div style={{padding:16,borderRadius:12,border:"2px solid transparent",background:"transparent",transition:"all 0.3s"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#4FC3F7",marginBottom:10,textAlign:"center"}}>Punto</div>
              <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                {playerCards.map(c=><Card key={c.id} card={c} size="md"/>)}
              </div>
            </div>
          </div>
        </div>

        <div style={{marginTop:12}}>
          {step==="playerDraw"&&(
            <div style={{padding:14,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#4FC3F7",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Punto → Carte ou Reste ?</div>
              {wrong&&<div style={{fontSize:10,color:"#C62828",fontWeight:700,marginBottom:6}}>✗</div>}
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button onClick={()=>answerPlayer("carte")} style={{padding:"10px 32px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Carte</button>
                <button onClick={()=>answerPlayer("reste")} style={{padding:"10px 32px",background:"transparent",color:"#F5F0E8",border:"2px solid rgba(201,168,76,0.3)",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Reste</button>
              </div>
            </div>
          )}
          {step==="bankerDraw"&&(
            <div style={{padding:14,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#EF5350",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Banco → Carte ou Reste ?</div>
              {wrong&&<div style={{fontSize:10,color:"#C62828",fontWeight:700,marginBottom:6}}>✗</div>}
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button onClick={()=>answerBanker("carte")} style={{padding:"10px 32px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Carte</button>
                <button onClick={()=>answerBanker("reste")} style={{padding:"10px 32px",background:"transparent",color:"#F5F0E8",border:"2px solid rgba(201,168,76,0.3)",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Reste</button>
              </div>
            </div>
          )}
          {step==="winner"&&(
            <div style={{padding:14,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Qui gagne ?</div>
              {winnerWrong&&<div style={{fontSize:10,color:"#C62828",fontWeight:700,marginBottom:6}}>✗</div>}
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button onClick={()=>answerWinner("player")} style={{padding:"10px 28px",background:"rgba(79,195,247,0.1)",border:"1px solid rgba(79,195,247,0.3)",borderRadius:4,fontSize:12,fontWeight:700,color:"#4FC3F7",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Punto</button>
                <button onClick={()=>answerWinner("tie")} style={{padding:"10px 28px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:4,fontSize:12,fontWeight:700,color:"#C9A84C",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Égalité</button>
                <button onClick={()=>answerWinner("banker")} style={{padding:"10px 28px",background:"rgba(239,83,80,0.1)",border:"1px solid rgba(239,83,80,0.3)",borderRadius:4,fontSize:12,fontWeight:700,color:"#EF5350",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Banco</button>
              </div>
            </div>
          )}
          {step==="done"&&(
            <div style={{textAlign:"center",marginTop:8}}><div style={{fontSize:16,fontWeight:700,color:"#2E7D46"}}>✓</div></div>
          )}
        </div>

        <details style={{marginTop:12}}>
          <summary style={{fontSize:9,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Règles de tirage</summary>
          <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.06)",borderRadius:4,padding:12,marginTop:6}}>
            <ThirdCardTable/>
          </div>
        </details>

        <div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
          {[{n:stats.rounds,l:"Coups"},{n:stats.total>0?`${Math.round(stats.ok/stats.total*100)}%`:"—",l:"Précision"},{n:stats.ok,l:"Correct"}].map((s,i)=>(
            <div key={i} style={{background:"#141414",border:"1px solid rgba(201,168,76,0.05)",borderRadius:3,padding:"5px",textAlign:"center"}}>
              <div style={{fontFamily:typeof s.n==="number"?"'Playfair Display',serif":"'DM Sans',sans-serif",fontSize:typeof s.n==="number"?15:9,fontWeight:typeof s.n==="number"?900:700,color:"#C9A84C"}}>{s.n}</div>
              <div style={{fontSize:6,color:"#BFB9AD",letterSpacing:"0.06em",textTransform:"uppercase",marginTop:1}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
