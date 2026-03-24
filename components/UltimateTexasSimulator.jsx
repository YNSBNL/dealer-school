import { useState, useRef } from "react";
import SimulatorHeader from "@/components/SimulatorHeader";
import { saveSession } from "@/lib/api";

// ── ENGINE ──
const SUITS=["♠","♥","♦","♣"],SC={"♠":"#1a1a1a","♥":"#C62828","♦":"#C62828","♣":"#1a1a1a"};
const RANKS=["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const RV={"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14};
const HN={9:"Quinte Flush Royale",8:"Quinte Flush",7:"Carre",6:"Full",5:"Couleur",4:"Suite",3:"Brelan",2:"Deux Paires",1:"Paire",0:"Carte Haute"};
const ALL_HANDS=Object.values(HN);
const BONUS_PT={9:50,8:40,7:30,6:8,5:7,4:4,3:3};
const BLIND_PT={9:500,8:50,7:10,6:3,5:1.5,4:1};
const PROG_PT={9:"jackpot",8:1500,7:500,6:50};
const TABLES=[{id:1,min:5,max:100,step:5},{id:2,min:10,max:200,step:10},{id:3,min:20,max:400,step:10}];
const SEATS=["Place 1","Place 2","Place 3","Place 4","Place 5","Place 6","Place 7"];

function mkDeck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,id:`${r}${s}${Math.random()}`});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function combos(c,n=5){const r=[];function f(s,o){if(o.length===n){r.push([...o]);return;}for(let i=s;i<c.length;i++){o.push(c[i]);f(i+1,o);o.pop();}}f(0,[]);return r;}
function ev5(c){const v=c.map(x=>RV[x.rank]).sort((a,b)=>b-a),su=c.map(x=>x.suit),fl=su.every(s=>s===su[0]);let st=false,sh=0;const u=[...new Set(v)].sort((a,b)=>b-a);if(u.length>=5){for(let i=0;i<=u.length-5;i++)if(u[i]-u[i+4]===4){st=true;sh=u[i];break;}if(!st&&u.includes(14)&&u.includes(2)&&u.includes(3)&&u.includes(4)&&u.includes(5)){st=true;sh=5;}}const ct={};v.forEach(x=>{ct[x]=(ct[x]||0)+1;});const g=Object.entries(ct).map(([k,c])=>({v:+k,c}));g.sort((a,b)=>b.c-a.c||b.v-a.v);if(fl&&st&&sh===14)return{rank:9,k:[14]};if(fl&&st)return{rank:8,k:[sh]};if(g[0].c===4)return{rank:7,k:[g[0].v,g[1].v]};if(g[0].c===3&&g[1].c===2)return{rank:6,k:[g[0].v,g[1].v]};if(fl)return{rank:5,k:v.slice(0,5)};if(st)return{rank:4,k:[sh]};if(g[0].c===3){const k=g.filter(x=>x.c===1).map(x=>x.v).sort((a,b)=>b-a);return{rank:3,k:[g[0].v,...k.slice(0,2)]};}if(g[0].c===2&&g[1].c===2){const k=g.find(x=>x.c===1);return{rank:2,k:[Math.max(g[0].v,g[1].v),Math.min(g[0].v,g[1].v),k?k.v:0]};}if(g[0].c===2){const k=g.filter(x=>x.c===1).map(x=>x.v).sort((a,b)=>b-a);return{rank:1,k:[g[0].v,...k.slice(0,3)]};}return{rank:0,k:v.slice(0,5)};}
function best7(c){if(c.length<5)return null;let b=null;for(const co of combos(c,5)){const e=ev5(co);if(!b||cmpH(e,b)>0)b=e;}return b;}
function cmpH(a,b){if(a.rank!==b.rank)return a.rank-b.rank;for(let i=0;i<Math.min(a.k.length,b.k.length);i++)if(a.k[i]!==b.k[i])return a.k[i]-b.k[i];return 0;}
function dQual(h){return h&&h.rank>=1;}

function blindQualifies(pc,cc,handRank){
  if(handRank<4)return false;
  const boardEval=best7(cc);
  const boardHasIt=boardEval&&boardEval.rank>=handRank;
  const fullEval=best7([...cc,...pc]);
  const fullHasIt=fullEval&&fullEval.rank>=handRank;
  if(fullHasIt&&!boardHasIt)return true;
  if(boardHasIt&&fullHasIt&&fullEval.rank>boardEval.rank)return true;
  if(boardHasIt)return false;
  return fullHasIt;
}

function calcPayout(p,pEval,dEval,dqual,cc,jackpot){
  const comp=cmpH(pEval,dEval);
  const boardEval=best7(cc);
  const communityRF=boardEval&&boardEval.rank===9;
  const br=BONUS_PT[pEval.rank]||0;
  let bonusPay=0;if(p.bonus>0&&br>0)bonusPay=p.bonus*br;
  if(communityRF&&p.bonus>0)bonusPay=p.bonus*50;
  let progPay=0;
  if(p.progressive&&pEval){
    if(communityRF){progPay=5000;}
    else{const pp=PROG_PT[pEval.rank];if(pp){if(pp==="jackpot")progPay=jackpot;else progPay=pp;}}
  }
  let mainPay=0;
  if(!communityRF&&comp>0){
    let jr=p.jouer;
    let mr=dqual?p.miser:0;
    let blr=0;
    if(blindQualifies(p.cards,cc,pEval.rank)){
      const bp=BLIND_PT[pEval.rank]||0;
      blr=bp>0?Math.floor(p.blind*bp):0;
    }
    mainPay=jr+mr+blr;
  }
  const payAmount=mainPay+bonusPay+progPay;
  const result=communityRF?"push":(comp>0?"win":comp<0?"lose":"push");
  return{payAmount,result,bonusPay,progPay,mainPay,communityRF};
}

// ── CARD ──
function Card({card,faceDown=false,size="md"}){
  const S={sm:{w:42,h:60,r:5,fi:12,si:10,ci:18,p:"3px"},md:{w:56,h:80,r:6,fi:16,si:13,ci:24,p:"4px 5px"},lg:{w:66,h:94,r:7,fi:19,si:15,ci:28,p:"5px 6px"}};
  const z=S[size]||S.md;
  if(faceDown)return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"linear-gradient(150deg,#8B1A1A,#5C0E0E 60%,#3D0808)",border:"1.5px solid rgba(201,168,76,0.45)",boxShadow:"0 4px 16px rgba(0,0,0,0.5)",flexShrink:0,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:3,borderRadius:z.r-1,border:"1px solid rgba(201,168,76,0.18)",background:"repeating-conic-gradient(rgba(201,168,76,0.04) 0% 25%,transparent 0% 50%) 0 0/6px 6px"}}/></div>);
  const col=SC[card.suit];
  return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"#fff",color:col,border:"1.5px solid #bbb",padding:z.p,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 3px 12px rgba(0,0,0,0.2),0 1px 2px rgba(0,0,0,0.1)",fontFamily:"'Playfair Display',serif",flexShrink:0,position:"relative"}}><div style={{lineHeight:1,display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div><div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:z.ci,lineHeight:1}}>{card.suit}</div><div style={{lineHeight:1,alignSelf:"flex-end",transform:"rotate(180deg)",display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div></div>);
}
function Chip({amount,size=26}){if(!amount||amount<=0)return null;const cm=[[1000,"#C9A84C"],[500,"#E65100"],[100,"#1a1a1a"],[50,"#1565C0"],[20,"#2E7D46"],[10,"#888"],[5,"#C62828"]];const c=cm.find(([v])=>v<=amount)||cm[cm.length-1];return <div style={{width:size,height:size,borderRadius:"50%",border:`3px solid ${c[1]}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size<=24?7:8,fontWeight:800,color:"#222",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}>{amount}</div>;}
function LED({on}){return <div style={{width:10,height:10,borderRadius:"50%",background:on?"#ff1a1a":"#2a2a2a",boxShadow:on?"0 0 6px #ff1a1a,0 0 14px rgba(255,26,26,0.3)":"inset 0 1px 2px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>;}
function Spot({label,val}){return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,width:32}}><div style={{width:26,height:26,borderRadius:"50%",border:val>0?"2px solid rgba(201,168,76,0.4)":"1.5px dashed rgba(255,255,255,0.08)",background:val>0?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>{val>0&&<Chip amount={val} size={22}/>}</div><span style={{fontSize:6,fontWeight:700,letterSpacing:"0.05em",color:"rgba(201,168,76,0.45)"}}>{label}</span></div>);}

function PlayerBox({p,idx,phase,revealIdx,isL1,showHand}){
  if(!p.active)return(<div style={{width:138,padding:"10px 6px",borderRadius:20,border:"2px dashed rgba(201,168,76,0.06)",opacity:0.15,textAlign:"center",minHeight:160,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.08)"}}><span style={{fontSize:8,color:"#BFB9AD"}}>VIDE</span></div>);
  const reveal=revealIdx===true||revealIdx===idx||phase==="resolved";
  const hl=revealIdx===idx;
  return(
    <div style={{width:138,borderRadius:20,border:hl?"2px solid rgba(201,168,76,0.45)":"2px solid rgba(201,168,76,0.1)",background:hl?"rgba(201,168,76,0.05)":"rgba(0,0,0,0.1)",padding:"7px 5px",transition:"all 0.3s"}}>
      <div style={{textAlign:"center",marginBottom:3}}><span style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(201,168,76,0.5)"}}>{SEATS[idx]}</span></div>
      <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:4}}>{p.cards.map(c=><Card key={c.id} card={c} faceDown={!reveal} size="sm"/>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"32px 32px",gap:"2px 4px",justifyContent:"center",marginBottom:2}}>
        <div/><Spot label="JOUER" val={p.jouer}/>
        <Spot label="BLIND" val={p.blind}/><Spot label="MISER" val={p.miser}/>
        <div/><Spot label="BONUS" val={p.bonus}/>
      </div>
      {!isL1&&<div style={{display:"flex",justifyContent:"center",marginBottom:2}}><LED on={p.progressive}/></div>}
      {showHand&&p.eval&&<div style={{textAlign:"center",fontSize:7,color:"#BFB9AD",borderTop:"1px solid rgba(201,168,76,0.04)",paddingTop:2,marginTop:1}}>{HN[p.eval.rank]}</div>}
    </div>);
}

function MCQ({question,onAnswer,wrong}){
  return(<div style={{padding:12,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:4}}>
    <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{question}</div>
    {wrong&&<div style={{fontSize:10,color:"#C62828",fontWeight:700,marginBottom:6}}>Essaie encore</div>}
    <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>{ALL_HANDS.map((h,i)=>(<button key={i} onClick={()=>onAnswer(h)} style={{padding:"6px 12px",background:"rgba(201,168,76,0.05)",border:"1px solid rgba(201,168,76,0.12)",borderRadius:3,color:"#F5F0E8",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.05)";}}>{h}</button>))}</div>
  </div>);
}

// ── MAIN ──
export default function UltimateTexasSimulator(){
  const [screen,setScreen]=useState("menu");
  const [table,setTable]=useState(null);
  const [jackpot,setJackpot]=useState(10000);
  const [diff,setDiff]=useState(1);
  const [dCards,setDCards]=useState([]);
  const [cc,setCC]=useState([]);
  const [players,setPlayers]=useState([]);
  const [phase,setPhase]=useState("idle");
  const [dEval,setDEval]=useState(null);
  const [dq,setDq]=useState(null);
  const [stats,setStats]=useState({rounds:0,score:0,ok:0,total:0});
  const [step,setStep]=useState("board");
  const [pIdx,setPIdx]=useState(-1);
  const [wrong,setWrong]=useState(false);
  const [payInput,setPayInput]=useState("");
  const [payFB,setPayFB]=useState(null);
  const [gameOver,setGameOver]=useState(null);
  const [handFound,setHandFound]=useState(new Set());
  const inpRef=useRef(null);

  const logUTH=(isCorrect,nStats)=>{saveSession({game_id:"ultimate-texas",mode:"guidee",score:isCorrect?100:0,accuracy:nStats.total>0?Math.round(nStats.ok/nStats.total*100):0,duration_seconds:0,rounds_played:1,rounds_correct:isCorrect?1:0,errors:isCorrect?[]:["mauvaise reponse"],details:{difficulty:diff}}).catch(()=>null);};
  const statsText = stats.total>0?`${Math.round(stats.ok/stats.total*100)}% · R${stats.rounds+1}`:`R1`;

  const deal=(tbl)=>{
    const t=tbl||table;if(!t)return;
    const d=mkDeck();let i=0;
    const np=[];
    for(let s=0;s<7;s++){
      const cards=[d[i++],d[i++]];
      const m=Math.min(t.min*(1+Math.floor(Math.random()*Math.min(4,Math.floor(t.max/t.min)))),t.max);
      const mr=Math.round(m/t.step)*t.step||t.min;
      const hasBets=diff>=2;
      const jm=hasBets?(1+Math.floor(Math.random()*4)):0;
      np.push({active:true,cards,miser:hasBets?mr:0,blind:hasBets?mr:0,bonus:hasBets&&Math.random()>0.4?t.min:0,jouer:hasBets?mr*jm:0,jouerMult:jm,progressive:hasBets&&Math.random()>0.5,folded:false,result:null,payout:0,eval:null,progressiveWin:0});
    }
    const dc=[d[i++],d[i++]];const board=[d[i++],d[i++],d[i++],d[i++],d[i++]];
    if(diff>=2)setJackpot(j=>j+np.filter(p=>p.progressive).length*5);
    setDCards(dc);setCC(board);setPlayers(np);
    setDEval(null);setDq(null);
    setStep("board");setPIdx(-1);setWrong(false);setPayInput("");setPayFB(null);setGameOver(null);setHandFound(new Set());
    setPhase("active");
  };

  const revealDealer=()=>{
    const de=best7([...dCards,...cc]);
    setDEval(de);setDq(dQual(de));setStep("dealer_hand");setWrong(false);
  };

  const answerDealerHand=(ans)=>{
    const ok=ans===HN[dEval.rank];
    if(ok){setStats(s=>({...s,score:s.score+15,ok:s.ok+1,total:s.total+1}));setPIdx(0);setStep("player_hand");setWrong(false);}
    else{setWrong(true);setStats(s=>({...s,total:s.total+1}));}
  };

  const answerPlayerHand=(ans)=>{
    const p=players[pIdx];
    const pe=best7([...p.cards,...cc]);
    const ok=ans===HN[pe.rank];
    if(ok){
      setStats(s=>({...s,score:s.score+15,ok:s.ok+1,total:s.total+1}));
      const np=[...players];np[pIdx]={...np[pIdx],eval:pe};setPlayers(np);
      setHandFound(prev=>new Set([...prev,pIdx]));
      if(diff>=2){
        const pay=calcPayout(np[pIdx],pe,dEval,dq,cc,jackpot);
        np[pIdx]={...np[pIdx],payout:pay.payAmount,result:pay.result,bonusPay:pay.bonusPay,progPay:pay.progPay};setPlayers(np);
        setStep("player_payout");setPayInput("");setPayFB(null);setWrong(false);
        setTimeout(()=>inpRef.current?.focus(),200);
      }else{goNextPlayer();}
    }else{setWrong(true);setStats(s=>({...s,total:s.total+1}));}
  };

  const answerPayout=(answer)=>{
    const p=players[pIdx];
    const hasPay=p.payout>0;
    let ok=false;
    if(answer==="ramasser"){ok=p.result==="lose"&&!hasPay;}
    else if(answer==="egalite"){ok=p.result==="push"&&!hasPay;}
    else{const v=parseInt(answer);ok=!isNaN(v)&&v===p.payout&&hasPay;}
    if(ok){
      setPayFB({ok:true});
      setStats(s=>({...s,score:s.score+20,ok:s.ok+1,total:s.total+1}));
      setTimeout(()=>{setPayFB(null);goNextPlayer();},1000);
    }else{
      let expected;
      if(p.result==="lose"&&!hasPay) expected="Ramasser";
      else if(p.result==="push"&&!hasPay) expected="Egalite";
      else expected=`${p.payout}EUR`;
      if(diff===3){
        let explain=`${SEATS[pIdx]} : ${p.eval?HN[p.eval.rank]:"?"}\n`;
        explain+=`Banque : ${dEval?HN[dEval.rank]:"?"} - ${dq?"Qualifiee":"Non qualifiee (Miser push)"}\n\n`;
        explain+=`Miser ${p.miser}EUR · Blind ${p.blind}EUR · Bonus ${p.bonus}EUR · Jouer ${p.jouer}EUR (${p.jouerMult}x)`;
        if(p.progressive)explain+=` · Prog 5EUR`;
        if(p.bonusPay>0)explain+=`\nBonus gagne : ${p.bonusPay}EUR`;
        if(p.progPay>0)explain+=`\nProgressif gagne : ${p.progPay}EUR`;
        explain+=`\n\nReponse attendue : ${expected}`;
        setGameOver({player:SEATS[pIdx],explain});
        const nsGO={...stats,total:stats.total+1};setStats(nsGO);logUTH(false,nsGO);
      }else{
        setPayFB({ok:false,exp:expected});
        setStats(s=>({...s,total:s.total+1}));
        setTimeout(()=>{setPayFB(null);goNextPlayer();},2000);
      }
    }
  };

  const goNextPlayer=()=>{
    let n=pIdx+1;
    if(n<7){setPIdx(n);setStep("player_hand");setWrong(false);setPayInput("");setPayFB(null);}
    else{setPhase("resolved");const ns={...stats,rounds:stats.rounds+1};setStats(ns);logUTH(true,ns);}
  };

  const showDealer=step!=="board";

  // ── MENU ──
  if(screen==="menu")return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Ultimate Texas Hold'em" badge="Ultimate Texas Hold'em" />
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"82vh",gap:20,padding:"0 16px"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>Simulateur Croupier</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,lineHeight:1.15,margin:0}}>Ultimate Texas <span style={{color:"#C9A84C",fontStyle:"italic"}}>Hold&apos;em</span></h1>
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02))",border:"1px solid rgba(201,168,76,0.2)",borderRadius:8,padding:"10px 24px",textAlign:"center"}}>
          <div style={{fontSize:7,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C9A84C"}}>Jackpot</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:"#C9A84C"}}>{jackpot.toLocaleString("fr-FR")} EUR</div>
        </div>
        <div>
          <div style={{textAlign:"center",fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#BFB9AD",marginBottom:6}}>Table</div>
          <div style={{display:"flex",gap:8}}>{TABLES.map(t=>(<div key={t.id} onClick={()=>{setTable(t);setScreen("game");setTimeout(()=>deal(t),50);}} style={{padding:"12px 14px",background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:6,cursor:"pointer",textAlign:"center",minWidth:120,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.35)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.1)";}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#C9A84C"}}>{t.min}EUR</div><div style={{fontSize:9,color:"#BFB9AD",marginTop:2}}>Max {t.max}EUR</div></div>))}</div>
        </div>
        <div>
          <div style={{textAlign:"center",fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#BFB9AD",marginBottom:5}}>Niveau</div>
          <div style={{display:"flex",gap:6}}>{[{d:1,l:"Lecture de board"},{d:2,l:"Paiements"},{d:3,l:"Expert"}].map(({d,l})=>(<div key={d} onClick={()=>setDiff(d)} style={{padding:"8px 16px",background:diff===d?"rgba(201,168,76,0.1)":"#141414",border:diff===d?"2px solid #C9A84C":"1px solid rgba(255,255,255,0.05)",borderRadius:4,cursor:"pointer",textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:900,color:diff===d?"#C9A84C":"#BFB9AD"}}>{d}</div><div style={{fontSize:8,color:"#BFB9AD",marginTop:1}}>{l}</div></div>))}</div>
        </div>
      </div>
    </div>);

  // ── GAME ──
  if(!table)return null;
  const isL1=diff===1;

  return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Ultimate Texas Hold'em" badge={`UTH · ${table.min}-${table.max}EUR`} stats={statsText} onBackToMenu={()=>{setScreen("menu");setPhase("idle");}} />
      <div style={{maxWidth:1100,margin:"0 auto",padding:"8px 8px"}}>
        <div style={{background:"radial-gradient(ellipse 120% 80% at 50% 50%,#1A6B4F,#15553A 40%,#0F3D1F 80%,#0B3320)",borderRadius:"12px 12px 50% 50%/12px 12px 18% 18%",padding:"14px 16px 24px",border:"4px solid rgba(201,168,76,0.18)",boxShadow:"inset 0 0 100px rgba(0,0,0,0.2),0 16px 50px rgba(0,0,0,0.45),0 0 0 6px #111",position:"relative",minHeight:450}}>
          <div style={{position:"absolute",top:"45%",left:"50%",transform:"translate(-50%,-50%)",fontSize:14,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(201,168,76,0.03)",fontFamily:"'Playfair Display',serif",whiteSpace:"nowrap",pointerEvents:"none"}}>ULTIMATE TEXAS HOLD&apos;EM</div>
          <div style={{display:"flex",justifyContent:"center",gap:4,flexWrap:"wrap",marginBottom:12,position:"relative",zIndex:2}}>
            {players.map((p,i)=><PlayerBox key={i} p={p} idx={i} phase={phase} revealIdx={pIdx>=0&&i<=pIdx?true:false} isL1={isL1} showHand={handFound.has(i)}/>)}
          </div>
          <div style={{textAlign:"center",margin:"14px 0",position:"relative",zIndex:2}}>
            <div style={{display:"flex",gap:7,justifyContent:"center"}}>
              {cc.map((c)=><Card key={c.id} card={c} size="lg"/>)}
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:14,position:"relative",zIndex:2}}>
            <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(201,168,76,0.4)",marginBottom:4}}>Banque</div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>
              {dCards.map(c=><Card key={c.id} card={c} faceDown={!showDealer} size="md"/>)}
            </div>
          </div>
        </div>

        <div style={{marginTop:8}}>
          {phase==="active"&&step==="board"&&(
            <div style={{padding:12,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:4,textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Board affiche</div>
              <button onClick={revealDealer} style={{padding:"9px 28px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Decouvrir la banque</button>
            </div>
          )}
          {phase==="active"&&step==="dealer_hand"&&!gameOver&&(
            <MCQ question="Quel est le jeu de la Banque ?" onAnswer={answerDealerHand} wrong={wrong}/>
          )}
          {phase==="active"&&step==="player_hand"&&pIdx>=0&&!gameOver&&(
            <MCQ question={`Quel est le jeu de ${SEATS[pIdx]} ?`} onAnswer={answerPlayerHand} wrong={wrong}/>
          )}
          {phase==="active"&&step==="player_payout"&&pIdx>=0&&!gameOver&&!payFB&&(
            <div style={{padding:12,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:4}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Paiement {SEATS[pIdx]} - {players[pIdx]?.eval?HN[players[pIdx].eval.rank]:""}</div>
              <div style={{display:"flex",gap:5,marginBottom:8,fontSize:8,color:"#BFB9AD",flexWrap:"wrap"}}>
                <span>Miser:{players[pIdx]?.miser}EUR</span><span>Blind:{players[pIdx]?.blind}EUR</span><span>Bonus:{players[pIdx]?.bonus}EUR</span><span>Jouer:{players[pIdx]?.jouer}EUR ({players[pIdx]?.jouerMult}x)</span>
                {players[pIdx]?.progressive&&<span style={{color:"#ff4444"}}>Prog 5EUR</span>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <button onClick={()=>answerPayout("ramasser")} style={{padding:"8px 18px",background:"rgba(198,40,40,0.1)",border:"1px solid rgba(198,40,40,0.3)",borderRadius:3,color:"#C62828",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Ramasser</button>
                <button onClick={()=>answerPayout("egalite")} style={{padding:"8px 18px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:3,color:"#C9A84C",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Egalite</button>
                <div style={{display:"flex",gap:4,flex:1,minWidth:150}}>
                  <input ref={inpRef} type="number" value={payInput} onChange={e=>setPayInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&payInput.trim()&&answerPayout(payInput.trim())} placeholder="Montant a payer" style={{flex:1,padding:"7px 8px",background:"#0a0a0a",border:"1px solid rgba(201,168,76,0.15)",borderRadius:2,color:"#F5F0E8",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none"}} autoFocus/>
                  <button onClick={()=>payInput.trim()&&answerPayout(payInput.trim())} disabled={!payInput.trim()} style={{padding:"7px 14px",background:payInput.trim()?"#C9A84C":"#333",color:"#0A0A0A",border:"none",borderRadius:2,fontSize:9,fontWeight:700,cursor:payInput.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>OK</button>
                </div>
              </div>
            </div>
          )}
          {payFB&&(
            <div style={{padding:10,background:payFB.ok?"rgba(46,125,70,0.08)":"rgba(198,40,40,0.08)",border:`1px solid ${payFB.ok?"rgba(46,125,70,0.2)":"rgba(198,40,40,0.2)"}`,borderRadius:4,textAlign:"center",marginTop:4}}>
              <div style={{fontSize:11,fontWeight:700,color:payFB.ok?"#2E7D46":"#C62828"}}>{payFB.ok?"Correct !":`Reponse attendue : ${payFB.exp}`}</div>
            </div>
          )}
          {gameOver&&(
            <div style={{padding:16,background:"#141414",border:"2px solid rgba(198,40,40,0.3)",borderRadius:6,marginTop:4}}>
              <div style={{textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:18,fontWeight:900,color:"#C62828",fontFamily:"'Playfair Display',serif",marginBottom:4}}>Partie terminee</div>
                <div style={{fontSize:11,color:"#BFB9AD"}}>Erreur sur <strong style={{color:"#C9A84C"}}>{gameOver.player}</strong></div>
              </div>
              <div style={{background:"rgba(0,0,0,0.3)",borderRadius:4,padding:14,fontSize:11,color:"#BFB9AD",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{gameOver.explain}</div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14}}>
                <button onClick={()=>{setGameOver(null);deal();}} style={{padding:"9px 28px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Recommencer</button>
                <button onClick={()=>{setScreen("menu");setPhase("idle");setGameOver(null);}} style={{padding:"9px 28px",background:"transparent",color:"#BFB9AD",border:"1px solid rgba(255,255,255,0.06)",borderRadius:3,fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Menu</button>
              </div>
            </div>
          )}
          {phase==="resolved"&&!gameOver&&(
            <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:8}}>
              <button onClick={()=>deal()} style={{padding:"9px 28px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Nouvelle main</button>
              <button onClick={()=>{setScreen("menu");setPhase("idle");}} style={{padding:"9px 28px",background:"transparent",color:"#BFB9AD",border:"1px solid rgba(255,255,255,0.06)",borderRadius:3,fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Menu</button>
            </div>
          )}
        </div>
        {diff>=2&&(<div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
          <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.05)",borderRadius:3,padding:6}}><div style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#C9A84C",marginBottom:2}}>Bonus</div><div style={{fontSize:7,color:"#BFB9AD",lineHeight:1.5}}>Brelan 3x · Suite 4x · Couleur 7x<br/>Full 8x · Carre 30x · QF 40x · QFR 50x<br/><span style={{color:"#ff4444"}}>QFR Communautaire : 50x + Egalite</span></div></div>
          <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.05)",borderRadius:3,padding:6}}><div style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#C9A84C",marginBottom:2}}>Blind</div><div style={{fontSize:7,color:"#BFB9AD",lineHeight:1.5}}>Suite 1x · Couleur 1.5x · Full 3x<br/>Carre 10x · QF 50x · QFR 500x</div></div>
          <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.05)",borderRadius:3,padding:6}}><div style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#C9A84C",marginBottom:2}}>Progressif (5EUR)</div><div style={{fontSize:7,color:"#BFB9AD",lineHeight:1.5}}>Full 50EUR · Carre 500EUR<br/>QF 1500EUR · QFR = <strong style={{color:"#C9A84C"}}>JACKPOT</strong><br/><span style={{color:"#ff4444"}}>QFR Communautaire : 5 000EUR</span></div></div>
        </div>)}
        <div style={{marginTop:5,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          {[{n:stats.score,l:"Score"},{n:stats.rounds,l:"Mains"},{n:stats.total>0?`${Math.round(stats.ok/stats.total*100)}%`:"--",l:"Precision"},{n:`${jackpot.toLocaleString("fr-FR")}EUR`,l:"Jackpot"}].map((s,i)=>(
            <div key={i} style={{background:"#141414",border:"1px solid rgba(201,168,76,0.05)",borderRadius:3,padding:"5px",textAlign:"center"}}>
              <div style={{fontFamily:typeof s.n==="number"?"'Playfair Display',serif":"'DM Sans',sans-serif",fontSize:typeof s.n==="number"?15:9,fontWeight:typeof s.n==="number"?900:700,color:"#C9A84C"}}>{s.n}</div>
              <div style={{fontSize:6,color:"#BFB9AD",letterSpacing:"0.06em",textTransform:"uppercase",marginTop:1}}>{s.l}</div>
            </div>))}
        </div>
      </div>
    </div>);
}
