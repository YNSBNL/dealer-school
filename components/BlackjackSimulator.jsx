import { useState, useRef, useEffect } from "react";
import SimulatorHeader from "@/components/SimulatorHeader";

// ── ENGINE ──
const SUITS=["♠","♥","♦","♣"],SC={"♠":"#1a1a1a","♥":"#C62828","♦":"#C62828","♣":"#1a1a1a"};
const RANKS=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const TABLES=[{id:1,min:20,max:2000,step:10},{id:2,min:50,max:5000,step:10}];
const SEATS=["Place 1","Place 2","Place 3","Place 4","Place 5","Place 6","Place 7"];

function mkDeck(n=6){const d=[];for(let x=0;x<n;x++)for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,id:`${r}${s}${x}${Math.random()}`});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function cv(c){if(["J","Q","K"].includes(c.rank))return 10;if(c.rank==="A")return 11;return parseInt(c.rank);}
function ht(cards){let t=cards.reduce((s,c)=>s+cv(c),0),a=cards.filter(c=>c.rank==="A").length;while(t>21&&a>0){t-=10;a--;}return t;}
function isBJ(cards){return cards.length===2&&ht(cards)===21;}
function isBust(cards){return ht(cards)>21;}

// ── CARD ──
function Card({card,faceDown=false,size="md"}){
  const S={sm:{w:42,h:60,r:5,fi:12,si:10,ci:18,p:"3px"},md:{w:56,h:80,r:6,fi:16,si:13,ci:24,p:"4px 5px"},lg:{w:66,h:94,r:7,fi:19,si:15,ci:28,p:"5px 6px"}};
  const z=S[size]||S.md;
  if(faceDown)return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"linear-gradient(150deg,#8B1A1A,#5C0E0E 60%,#3D0808)",border:"1.5px solid rgba(201,168,76,0.45)",boxShadow:"0 4px 16px rgba(0,0,0,0.5)",flexShrink:0,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:3,borderRadius:z.r-1,border:"1px solid rgba(201,168,76,0.18)",background:"repeating-conic-gradient(rgba(201,168,76,0.04) 0% 25%,transparent 0% 50%) 0 0/6px 6px"}}/></div>);
  const col=SC[card.suit];
  return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"#fff",color:col,border:"1.5px solid #bbb",padding:z.p,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 3px 12px rgba(0,0,0,0.2),0 1px 2px rgba(0,0,0,0.1)",fontFamily:"'Playfair Display',serif",flexShrink:0,position:"relative"}}><div style={{lineHeight:1,display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div><div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:z.ci,lineHeight:1}}>{card.suit}</div><div style={{lineHeight:1,alignSelf:"flex-end",transform:"rotate(180deg)",display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div></div>);
}
function LED({on}){return <div style={{width:10,height:10,borderRadius:"50%",background:on?"#ff1a1a":"#2a2a2a",boxShadow:on?"0 0 6px #ff1a1a,0 0 14px rgba(255,26,26,0.3)":"inset 0 1px 2px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>;}

// ── PLAYER BOX ──
function BJBox({p,idx,showCards,highlight,hideChips,activeSplitIdx}){
  if(!p.active)return(<div style={{width:120,padding:"10px 6px",borderRadius:20,border:"2px dashed rgba(201,168,76,0.06)",opacity:0.15,textAlign:"center",minHeight:130,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.08)"}}><span style={{fontSize:8,color:"#BFB9AD"}}>VIDE</span></div>);
  const reveal=showCards||p.resolved;

  if(p.splitHands){
    return(
      <div style={{width:Math.max(120,p.splitHands.length*68),borderRadius:20,border:highlight?"2px solid rgba(201,168,76,0.45)":"2px solid rgba(201,168,76,0.1)",background:highlight?"rgba(201,168,76,0.05)":"rgba(0,0,0,0.1)",padding:"7px 5px",transition:"all 0.3s"}}>
        <div style={{textAlign:"center",marginBottom:3}}><span style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(201,168,76,0.5)"}}>{SEATS[idx]} · SPLIT</span></div>
        <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
          {p.splitHands.map((sh,si)=>(
            <div key={si} style={{border:highlight&&activeSplitIdx===si?"1.5px solid #C9A84C":"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:3,background:highlight&&activeSplitIdx===si?"rgba(201,168,76,0.08)":"transparent",minWidth:54}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:2}}>
                <div style={{position:"relative",height:sh.cards.length>0?45+(sh.cards.length-1)*14:45,width:36+(sh.cards.length-1)*5}}>
                  {sh.cards.map((c,ci)=>(<div key={c.id} style={{position:"absolute",top:ci*14,left:ci*5,zIndex:ci}}><Card card={c} faceDown={!reveal} size="sm"/></div>))}
                </div>
              </div>
              {sh.resultText&&(<div style={{textAlign:"center",fontSize:7,fontWeight:800,color:sh.resultText==="GAGNE"?"#2E7D46":sh.resultText==="BUST"||sh.resultText==="PERD"?"#C62828":"#C9A84C"}}>{sh.resultText}</div>)}
            </div>
          ))}
        </div>
        {p.resultText&&!p.splitHands.some(h=>h.resultText)&&(<div style={{textAlign:"center",fontSize:8,fontWeight:800,letterSpacing:"0.1em",color:p.resultText.includes("GAGNE")||p.resultText==="BJ 3:2"?"#2E7D46":p.resultText.includes("PERD")||p.resultText==="BUST"?"#C62828":"#C9A84C",borderTop:"1px solid rgba(201,168,76,0.04)",paddingTop:2}}>{p.resultText}</div>)}
      </div>);
  }

  return(
    <div style={{width:120,borderRadius:20,border:highlight?"2px solid rgba(201,168,76,0.45)":"2px solid rgba(201,168,76,0.1)",background:highlight?"rgba(201,168,76,0.05)":"rgba(0,0,0,0.1)",padding:"7px 5px",transition:"all 0.3s"}}>
      <div style={{textAlign:"center",marginBottom:3}}><span style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(201,168,76,0.5)"}}>{SEATS[idx]}</span></div>
      <div style={{display:"flex",justifyContent:"center",marginBottom:3}}>
        <div style={{position:"relative",height:p.cards.length>0?60+(p.cards.length-1)*18:60,width:46+(p.cards.length-1)*6}}>
          {p.cards.map((c,i)=>(<div key={c.id} style={{position:"absolute",top:i*18,left:i*6,zIndex:i}}><Card card={c} faceDown={!reveal} size="sm"/></div>))}
        </div>
      </div>
      {!hideChips&&(<div style={{display:"flex",justifyContent:"center",marginBottom:2}}><LED on={p.blazing}/></div>)}
      {p.resultText&&(<div style={{textAlign:"center",fontSize:8,fontWeight:800,letterSpacing:"0.1em",color:p.resultText==="BJ 3:2"||p.resultText==="GAGNE"?"#2E7D46":p.resultText==="PERD"||p.resultText==="BUST"?"#C62828":"#C9A84C",borderTop:"1px solid rgba(201,168,76,0.04)",paddingTop:2}}>{p.resultText}</div>)}
    </div>);
}

// ── MAIN ──
export default function BlackjackSimulator(){
  const [screen,setScreen]=useState("menu");
  const [table,setTable]=useState(null);
  const [diff,setDiff]=useState(1);
  const [jackpot,setJackpot]=useState(15000);
  const [minorJp,setMinorJp]=useState(5000);
  const [deck,setDeck]=useState([]);
  const [dealerCards,setDealerCards]=useState([]);
  const [players,setPlayers]=useState([]);
  const [phase,setPhase]=useState("idle");
  const [l1Cards,setL1Cards]=useState([]);
  const [l1Done,setL1Done]=useState(false);
  const [l1Result,setL1Result]=useState("");
  const [step,setStep]=useState("deal");
  const [activeBox,setActiveBox]=useState(-1);
  const [activeSplit,setActiveSplit]=useState(0);
  const [dealerPhase,setDealerPhase]=useState(false);
  const [insuranceOffered,setInsuranceOffered]=useState(false);
  const [stats,setStats]=useState({rounds:0,score:0,ok:0,total:0});
  const [l3Num,setL3Num]=useState(0);
  const [l3Input,setL3Input]=useState("");
  const [l3Comp,setL3Comp]=useState(false);
  const [l3Timer,setL3Timer]=useState(7);
  const [l3TimeLeft,setL3TimeLeft]=useState(0);
  const [l3Round,setL3Round]=useState(0);
  const [l3Errors,setL3Errors]=useState([]);
  const [l3Done,setL3Done]=useState(false);
  const l3Ref=useRef(null);
  const timerRef=useRef(null);

  const statsText = stats.total>0?`${Math.round(stats.ok/stats.total*100)}% · R${stats.rounds+1}`:`R1`;

  // ── LEVEL 1: Addition ──
  const L1_RANKS=["A","2","3","4","5","6","7","8","9"];
  const mkL1Deck=()=>{const d=[];for(let x=0;x<6;x++)for(const s of SUITS)for(const r of L1_RANKS)d.push({rank:r,suit:s,id:`${r}${s}${x}${Math.random()}`});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;};
  const l1Deal=()=>{const d=mkL1Deck();setL1Cards([d[0],d[1]]);setDeck(d.slice(2));setL1Done(false);setL1Result("");setPhase("l1");};
  const l1Hit=()=>{if(l1Done)return;const nc=[...l1Cards,deck[0]];setL1Cards(nc);setDeck(d=>d.slice(1));if(ht(nc)>21){setL1Done(true);setL1Result("bust");setTimeout(()=>l1Deal(),1200);}};
  const l1Stand=()=>{if(l1Done)return;const t=ht(l1Cards);if(t>=17&&t<=21){setL1Done(true);setL1Result("ok");setStats(s=>({...s,score:s.score+15,ok:s.ok+1,total:s.total+1,rounds:s.rounds+1}));setTimeout(()=>l1Deal(),1200);}else{setL1Done(true);setL1Result("fail");setStats(s=>({...s,total:s.total+1}));setTimeout(()=>l1Deal(),1200);}};

  // ── LEVEL 2: Entrainement ──
  const deal2=(tbl)=>{
    const t=tbl||table;if(!t)return;const d=mkDeck(6);let idx=0;
    const np=[];for(let s=0;s<7;s++){const c1=d[idx++],c2=d[idx++];np.push({active:true,cards:[c1,c2],bet:0,blazing:false,blazingWin:0,resolved:false,resultText:"",insurance:false,splitHands:null,splitCount:0});}
    const dc=[d[idx++]];
    setDeck(d.slice(idx));setDealerCards(dc);setPlayers(np);setDealerPhase(false);setActiveSplit(0);
    const dealerUp=dc[0];
    if(dealerUp.rank==="A"){setInsuranceOffered(true);setStep("insurance");}
    else{
      const cv10=cv(dealerUp)===10;
      if(!cv10){const up=np.map(p=>isBJ(p.cards)?{...p,resolved:true,resultText:"BJ 3:2"}:p);setPlayers(up);}
      setStep("play");setActiveBox(np.findIndex((p,i)=>!isBJ(np[i]?.cards)));setActiveSplit(0);
    }
    setPhase("game2");
  };
  const handleIns2=(take)=>{
    setInsuranceOffered(false);
    const dc2=[...dealerCards,deck[0]];const dk=deck.slice(1);setDealerCards(dc2);setDeck(dk);
    if(isBJ(dc2)){
      setPlayers(ps=>ps.map(p=>({...p,resolved:true,resultText:isBJ(p.cards)?"PUSH":"PERD"})));setStep("resolve");setPhase("resolved");setStats(s=>({...s,rounds:s.rounds+1}));
    }else{
      const up=players.map(p=>isBJ(p.cards)?{...p,resolved:true,resultText:"BJ 3:2"}:p);setPlayers(up);
      setStep("play");setActiveBox(up.findIndex(p=>!p.resolved));setActiveSplit(0);
    }
  };

  const canSplit2=()=>{
    const i=activeBox;if(i<0||i>=7)return false;
    const p=players[i];
    if(p.splitHands){
      const sh=p.splitHands[activeSplit];
      if(!sh||sh.resolved)return false;
      if(sh.cards.length!==2)return false;
      if(sh.cards[0].rank!==sh.cards[1].rank)return false;
      return p.splitCount<3;
    }else{
      if(p.cards.length!==2)return false;
      if(p.cards[0].rank!==p.cards[1].rank)return false;
      return true;
    }
  };

  const u2Split=()=>{
    const i=activeBox;if(i<0||i>=7||!canSplit2())return;
    const np=[...players];const p={...np[i]};
    let dk=[...deck];
    if(!p.splitHands){
      const c1=p.cards[0],c2=p.cards[1];
      const nc1=dk[0];dk=dk.slice(1);
      const nc2=dk[0];dk=dk.slice(1);
      p.splitHands=[{cards:[c1,nc1],resolved:false,resultText:""},{cards:[c2,nc2],resolved:false,resultText:""}];
      p.splitCount=1;
      p.cards=p.splitHands[0].cards;
    }else{
      const sh=[...p.splitHands];
      const cur={...sh[activeSplit]};
      const c1=cur.cards[0],c2=cur.cards[1];
      const nc1=dk[0];dk=dk.slice(1);
      const nc2=dk[0];dk=dk.slice(1);
      sh[activeSplit]={cards:[c1,nc1],resolved:false,resultText:""};
      sh.splice(activeSplit+1,0,{cards:[c2,nc2],resolved:false,resultText:""});
      p.splitHands=sh;
      p.splitCount+=1;
    }
    if(p.splitHands){
      p.splitHands=p.splitHands.map(h=>{
        if(!h.resolved&&ht(h.cards)===21)return{...h,resolved:true};
        return h;
      });
    }
    np[i]=p;
    setPlayers(np);setDeck(dk);
    const nextSh=p.splitHands.findIndex(h=>!h.resolved);
    if(nextSh>=0)setActiveSplit(nextSh);
    else goNext2(np,i);
  };

  const u2Hit=()=>{
    const i=activeBox;if(i<0||i>=7)return;
    const np=[...players];const p={...np[i]};
    const card=deck[0];
    if(p.splitHands){
      const sh=[...p.splitHands];
      const cur={...sh[activeSplit]};
      cur.cards=[...cur.cards,card];
      const t=ht(cur.cards);
      if(t>21){cur.resolved=true;cur.resultText="BUST";}
      else if(t===21){cur.resolved=true;}
      sh[activeSplit]=cur;
      p.splitHands=sh;
      np[i]=p;
      setPlayers(np);setDeck(d=>d.slice(1));
      if(cur.resolved){
        const nextSh=sh.findIndex((h,idx)=>idx>activeSplit&&!h.resolved);
        if(nextSh>=0)setActiveSplit(nextSh);
        else{
          if(sh.every(h=>h.resolved)){p.resolved=true;np[i]=p;setPlayers(np);goNext2(np,i);}
          else{const first=sh.findIndex(h=>!h.resolved);if(first>=0)setActiveSplit(first);else{p.resolved=true;np[i]=p;setPlayers(np);goNext2(np,i);}}
        }
      }
    }else{
      p.cards=[...p.cards,card];
      const t=ht(p.cards);
      if(t>21){p.resolved=true;p.resultText="BUST";np[i]=p;setPlayers(np);setDeck(d=>d.slice(1));goNext2(np,i);}
      else if(t===21){p.resolved=true;np[i]=p;setPlayers(np);setDeck(d=>d.slice(1));goNext2(np,i);}
      else{np[i]=p;setPlayers(np);setDeck(d=>d.slice(1));}
    }
  };

  const u2Stand=()=>{
    const i=activeBox;
    const np=[...players];const p={...np[i]};
    if(p.splitHands){
      const sh=[...p.splitHands];
      sh[activeSplit]={...sh[activeSplit],resolved:true};
      p.splitHands=sh;
      np[i]=p;
      setPlayers(np);
      const nextSh=sh.findIndex((h,idx)=>idx>activeSplit&&!h.resolved);
      if(nextSh>=0)setActiveSplit(nextSh);
      else{
        if(sh.every(h=>h.resolved)){p.resolved=true;np[i]=p;setPlayers(np);goNext2(np,i);}
        else{const first=sh.findIndex(h=>!h.resolved);if(first>=0)setActiveSplit(first);else{p.resolved=true;np[i]=p;setPlayers(np);goNext2(np,i);}}
      }
    }else{
      p.resolved=true;np[i]=p;setPlayers(np);goNext2(np,i);
    }
  };

  const goNext2=(np,cur)=>{let n=cur+1;while(n<7&&np[n]?.resolved)n++;if(n>=7){setDealerPhase(true);setStep("dealer");dealerDraw2();}else{setActiveBox(n);setActiveSplit(0);}};

  const dealerDraw2=()=>{
    if(dealerCards.length===1){const dc2=[...dealerCards,deck[0]];setDealerCards(dc2);setDeck(d=>d.slice(1));}
    setDealerPhase(true);
  };
  const dealerHit2=()=>{const dc=[...dealerCards,deck[0]];setDealerCards(dc);setDeck(d=>d.slice(1));if(ht(dc)>21)resolveFinal2(dc);};
  const dealerStop2=()=>{resolveFinal2(dealerCards);};
  const resolveOneHand=(cards,dt,dBust)=>{
    const pt=ht(cards);
    if(isBust(cards))return "BUST";
    if(dBust)return "GAGNE";
    if(pt>dt)return "GAGNE";
    if(pt<dt)return "PERD";
    return "PUSH";
  };
  const resolveFinal2=(dc)=>{
    const dt=ht(dc);const dBust=dt>21;const dBJ2=isBJ(dc);
    const up=players.map(p=>{
      if(!p.active||p.resultText==="BJ 3:2"||p.resultText==="BUST"||p.resultText==="PERD"||p.resultText==="PUSH")return p;
      if(p.splitHands){
        const resolvedHands=p.splitHands.map(h=>{
          if(h.resultText==="BUST")return h;
          const res=resolveOneHand(h.cards,dt,dBust);
          return{...h,resolved:true,resultText:res};
        });
        const results=resolvedHands.map(h=>h.resultText);
        const wins=results.filter(r=>r==="GAGNE"||r==="BJ 3:2").length;
        const losses=results.filter(r=>r==="PERD"||r==="BUST").length;
        let summary="";
        if(wins>0&&losses>0)summary=`${wins}W/${losses}L`;
        else if(wins===results.length)summary="GAGNE";
        else if(losses===results.length)summary="PERD";
        else summary="PUSH";
        return{...p,resolved:true,resultText:summary,splitHands:resolvedHands};
      }
      const pt=ht(p.cards);
      if(isBust(p.cards))return{...p,resolved:true,resultText:"BUST"};
      if(isBJ(p.cards)&&dBJ2)return{...p,resolved:true,resultText:"PUSH"};
      if(isBJ(p.cards))return{...p,resolved:true,resultText:"BJ 3:2"};
      if(dBJ2)return{...p,resolved:true,resultText:"PERD"};
      if(dBust)return{...p,resolved:true,resultText:"GAGNE"};
      if(pt>dt)return{...p,resolved:true,resultText:"GAGNE"};
      if(pt<dt)return{...p,resolved:true,resultText:"PERD"};
      return{...p,resolved:true,resultText:"PUSH"};
    });
    setPlayers(up);setDealerPhase(false);setStep("resolve");setPhase("resolved");
    setStats(s=>({...s,rounds:s.rounds+1}));
    setTimeout(()=>deal2(),2000);
  };

  // ── LEVEL 3: Calcul BJ (x1.5) ──
  const genL3=()=>{return (Math.floor(Math.random()*199)+2)*10;};
  const startL3=()=>{const n=genL3();setL3Num(n);setL3Input("");setL3Round(1);setL3Errors([]);setL3Done(false);setPhase("l3");setTimeout(()=>l3Ref.current?.focus(),100);};
  const startL3Comp=(timer)=>{setL3Comp(true);setL3Timer(timer);const n=genL3();setL3Num(n);setL3Input("");setL3Round(1);setL3Errors([]);setL3Done(false);setL3TimeLeft(timer);setPhase("l3");setTimeout(()=>l3Ref.current?.focus(),100);};

  useEffect(()=>{
    if(phase!=="l3"||!l3Comp||l3Done)return;
    if(timerRef.current)clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      setL3TimeLeft(t=>{
        if(t<=1){
          setL3Errors(e=>[...e,{num:l3Num,expected:Math.round(l3Num*1.5),given:"timeout"}]);
          setStats(s=>({...s,total:s.total+1}));
          if(l3Round>=50){setL3Done(true);clearInterval(timerRef.current);return 0;}
          const nn=genL3();setL3Num(nn);setL3Input("");setL3Round(r=>r+1);
          setTimeout(()=>l3Ref.current?.focus(),50);
          return l3Timer;
        }
        return t-1;
      });
    },1000);
    return ()=>clearInterval(timerRef.current);
  },[phase,l3Comp,l3Done,l3Num,l3Round]);

  useEffect(()=>{return()=>{if(timerRef.current)clearInterval(timerRef.current);};},[]);

  const submitL3=()=>{
    const v=parseInt(l3Input);const expected=Math.round(l3Num*1.5);const ok=v===expected;
    setStats(s=>({...s,score:s.score+(ok?10:0),ok:s.ok+(ok?1:0),total:s.total+1}));
    if(!ok){
      if(l3Comp){
        setL3Errors(e=>[...e,{num:l3Num,expected,given:v||"?"}]);
        if(l3Round>=50){setL3Done(true);if(timerRef.current)clearInterval(timerRef.current);return;}
        const nn=genL3();setL3Num(nn);setL3Input("");setL3Round(r=>r+1);setL3TimeLeft(l3Timer);
      }else{
        setL3Input("");
      }
      setTimeout(()=>l3Ref.current?.focus(),50);
      return;
    }
    if(l3Comp&&l3Round>=50){setL3Done(true);if(timerRef.current)clearInterval(timerRef.current);return;}
    const nn=genL3();setL3Num(nn);setL3Input("");
    if(l3Comp){setL3Round(r=>r+1);setL3TimeLeft(l3Timer);}
    else setL3Round(r=>r+1);
    setTimeout(()=>l3Ref.current?.focus(),50);
  };

  // ── MENU ──
  if(screen==="menu")return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Blackjack" badge="Blackjack" />
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"82vh",gap:20,padding:"0 16px"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>Simulateur Croupier</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,lineHeight:1.15,margin:0}}><span style={{color:"#C9A84C",fontStyle:"italic"}}>Blackjack</span></h1>
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02))",border:"1px solid rgba(201,168,76,0.2)",borderRadius:8,padding:"10px 24px",textAlign:"center"}}>
          <div style={{fontSize:7,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C9A84C"}}>Blazing 7s</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:"#C9A84C"}}>Major {jackpot.toLocaleString("fr-FR")}EUR · Minor {minorJp.toLocaleString("fr-FR")}EUR</div>
        </div>
        {diff===2&&(<div>
          <div style={{textAlign:"center",fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#BFB9AD",marginBottom:6}}>Table</div>
          <div style={{display:"flex",gap:8}}>{TABLES.map(t=>(<div key={t.id} onClick={()=>{setTable(t);setScreen("game");setTimeout(()=>deal2(t),50);}} style={{padding:"12px 14px",background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:6,cursor:"pointer",textAlign:"center",minWidth:120}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.35)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.1)";}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#C9A84C"}}>{t.min}EUR</div><div style={{fontSize:9,color:"#BFB9AD",marginTop:2}}>Max {t.max}EUR</div></div>))}</div>
        </div>)}
        <div>
          <div style={{textAlign:"center",fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#BFB9AD",marginBottom:5}}>Niveau</div>
          <div style={{display:"flex",gap:6}}>{[{d:1,l:"Addition"},{d:2,l:"Entrainement"},{d:3,l:"Calcul de Blackjack"}].map(({d,l})=>(<div key={d} onClick={()=>setDiff(d)} style={{padding:"8px 16px",background:diff===d?"rgba(201,168,76,0.1)":"#141414",border:diff===d?"2px solid #C9A84C":"1px solid rgba(255,255,255,0.05)",borderRadius:4,cursor:"pointer",textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:900,color:diff===d?"#C9A84C":"#BFB9AD"}}>{d}</div><div style={{fontSize:7,color:"#BFB9AD",marginTop:1}}>{l}</div></div>))}</div>
        </div>
        {(diff===1||diff===3)&&(<button onClick={()=>{setTable(TABLES[0]);setScreen("game");if(diff===1)setTimeout(()=>l1Deal(),50);else setTimeout(()=>startL3(),50);}} style={{padding:"12px 36px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Commencer</button>)}
      </div>
    </div>);

  // ── LEVEL 1: Addition ──
  if(phase==="l1")return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Blackjack" badge="BJ · Addition" stats={statsText} onBackToMenu={()=>{setScreen("menu");setPhase("idle");if(timerRef.current)clearInterval(timerRef.current);}} />
      <div style={{maxWidth:500,margin:"0 auto",padding:"40px 16px",textAlign:"center"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C9A84C",marginBottom:16}}>Arrete-toi entre 17 et 21 - L As vaut 1 ou 11</div>
        <div style={{background:"radial-gradient(ellipse,#1A6B4F,#0F3D1F)",borderRadius:16,padding:"32px 24px",border:"3px solid rgba(201,168,76,0.15)",boxShadow:"inset 0 0 60px rgba(0,0,0,0.2)"}}>
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:8,flexWrap:"wrap"}}>{l1Cards.map(c=><Card key={c.id} card={c} size="lg"/>)}</div>
        </div>
        <div style={{marginTop:20}}>
          {l1Result==="ok"?(<div style={{fontSize:18,fontWeight:700,color:"#2E7D46"}}>OK</div>):l1Result==="fail"?(<div style={{fontSize:18,fontWeight:700,color:"#C62828"}}>✗</div>):l1Result==="bust"?(<div style={{fontSize:14,fontWeight:700,color:"#BFB9AD"}}>Bust - nouvelle main</div>):(
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={l1Hit} style={{padding:"12px 36px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:13,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Carte</button>
              <button onClick={l1Stand} style={{padding:"12px 36px",background:"transparent",color:"#F5F0E8",border:"2px solid rgba(201,168,76,0.3)",borderRadius:4,fontSize:13,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Stop</button>
            </div>)}
        </div>
      </div>
    </div>);

  // ── LEVEL 3: Calcul de BJ ──
  if(phase==="l3")return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Blackjack" badge="BJ · Calcul BJ" stats={statsText} onBackToMenu={()=>{setScreen("menu");setPhase("idle");if(timerRef.current)clearInterval(timerRef.current);}} />
      <div style={{maxWidth:500,margin:"0 auto",padding:"40px 16px",textAlign:"center"}}>
        {!l3Done?(
          <>
            {l3Comp&&<div style={{fontSize:10,fontWeight:700,color:"#C9A84C",marginBottom:6}}>Competition - {l3Round}/50 · {l3TimeLeft}s</div>}
            {!l3Comp&&<div style={{fontSize:10,fontWeight:700,color:"#C9A84C",marginBottom:6}}>Calcule x 1.5 (paiement BJ 3:2)</div>}
            <div style={{background:"radial-gradient(ellipse,#1A6B4F,#0F3D1F)",borderRadius:16,padding:"40px 24px",border:"3px solid rgba(201,168,76,0.15)",marginBottom:20}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:900,color:"#F5F0E8"}}>{l3Num}EUR</div>
              <div style={{fontSize:11,color:"rgba(201,168,76,0.5)",marginTop:4}}>x 1.5 = ?</div>
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>
              <input ref={l3Ref} type="number" value={l3Input} onChange={e=>setL3Input(e.target.value)} onKeyDown={e=>e.key==="Enter"&&l3Input.trim()&&submitL3()} placeholder="Resultat" style={{width:160,padding:"10px 14px",background:"#0a0a0a",border:"1px solid rgba(201,168,76,0.2)",borderRadius:4,color:"#F5F0E8",fontSize:20,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center"}} autoFocus/>
              <button onClick={()=>l3Input.trim()&&submitL3()} disabled={!l3Input.trim()} style={{padding:"10px 24px",background:l3Input.trim()?"#C9A84C":"#333",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,cursor:l3Input.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>OK</button>
            </div>
            {!l3Comp&&(
              <div style={{marginTop:24,borderTop:"1px solid rgba(201,168,76,0.08)",paddingTop:16}}>
                <div style={{fontSize:9,fontWeight:700,color:"#BFB9AD",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Mode Competition</div>
                <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  {[5,7,10].map(t=>(<button key={t} onClick={()=>startL3Comp(t)} style={{padding:"8px 18px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:3,color:"#C9A84C",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t}s · 50 rounds</button>))}
                </div>
              </div>
            )}
          </>
        ):(
          <div>
            <div style={{fontSize:16,fontWeight:900,fontFamily:"'Playfair Display',serif",color:"#C9A84C",marginBottom:12}}>Recapitulatif</div>
            <div style={{fontSize:13,color:"#BFB9AD",marginBottom:16}}>{50-l3Errors.length}/50 corrects · {l3Errors.length} erreurs</div>
            {l3Errors.length>0&&(
              <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.08)",borderRadius:6,padding:12,maxHeight:300,overflowY:"auto",textAlign:"left"}}>
                {l3Errors.map((e,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",fontSize:11,color:"#BFB9AD"}}><span>{e.num}EUR x 1.5</span><span style={{color:"#C62828"}}>{e.given} <span style={{color:"#888"}}>-&gt;</span> <span style={{color:"#2E7D46"}}>{e.expected}EUR</span></span></div>))}
              </div>
            )}
            <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:16}}>
              <button onClick={()=>startL3Comp(l3Timer)} style={{padding:"9px 24px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Recommencer</button>
              <button onClick={()=>{setL3Comp(false);startL3();}} style={{padding:"9px 24px",background:"transparent",color:"#BFB9AD",border:"1px solid rgba(255,255,255,0.08)",borderRadius:3,fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Mode libre</button>
            </div>
          </div>
        )}
      </div>
    </div>);

  // ── LEVEL 2: Entrainement (game) ──
  if(!table)return null;
  const dealerShow=step==="dealer"||step==="resolve"||phase==="resolved";

  return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif"}}>
      <SimulatorHeader title="Blackjack" badge="BJ · Entrainement" stats={statsText} onBackToMenu={()=>{setScreen("menu");setPhase("idle");if(timerRef.current)clearInterval(timerRef.current);}} />
      <div style={{maxWidth:1100,margin:"0 auto",padding:"8px 8px"}}>
        <div style={{background:"radial-gradient(ellipse 120% 80% at 50% 50%,#1A6B4F,#15553A 40%,#0F3D1F 80%,#0B3320)",borderRadius:"12px 12px 50% 50%/12px 12px 18% 18%",padding:"14px 16px 24px",border:"4px solid rgba(201,168,76,0.18)",boxShadow:"inset 0 0 100px rgba(0,0,0,0.2),0 16px 50px rgba(0,0,0,0.45),0 0 0 6px #111",position:"relative",minHeight:400}}>
          <div style={{position:"absolute",top:"42%",left:"50%",transform:"translate(-50%,-50%)",fontSize:16,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(201,168,76,0.03)",fontFamily:"'Playfair Display',serif",whiteSpace:"nowrap",pointerEvents:"none"}}>BLACKJACK</div>
          <div style={{display:"flex",justifyContent:"center",gap:4,flexWrap:"wrap",marginBottom:16,position:"relative",zIndex:2}}>
            {players.map((p,i)=><BJBox key={i} p={p} idx={i} showCards={true} highlight={i===activeBox&&step==="play"} hideChips={true} activeSplitIdx={i===activeBox?activeSplit:0}/>)}
          </div>
          {insuranceOffered&&(<div style={{textAlign:"center",margin:"12px 0",padding:"10px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(201,168,76,0.2)"}}><div style={{fontSize:11,fontWeight:700,color:"#C9A84C",marginBottom:6}}>INSURANCE ?</div><div style={{display:"flex",gap:8,justifyContent:"center"}}><button onClick={()=>handleIns2(true)} style={{padding:"8px 20px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Oui</button><button onClick={()=>handleIns2(false)} style={{padding:"8px 20px",background:"transparent",color:"#F5F0E8",border:"1px solid rgba(255,255,255,0.15)",borderRadius:3,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Non</button></div></div>)}
          <div style={{textAlign:"center",marginTop:16,position:"relative",zIndex:2}}>
            <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(201,168,76,0.4)",marginBottom:4}}>Banque</div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>
              {dealerCards.map((c,i)=><Card key={c.id} card={c} faceDown={i>=1&&!dealerShow} size="md"/>)}
            </div>
          </div>
        </div>
        <div style={{marginTop:8}}>
          {step==="play"&&activeBox>=0&&activeBox<7&&players[activeBox]&&!players[activeBox].resolved&&!insuranceOffered&&(
            <div style={{padding:12,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:4,textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{SEATS[activeBox]}{players[activeBox].splitHands?` · Jeu ${activeSplit+1}/${players[activeBox].splitHands.length}`:""}</div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button onClick={u2Hit} style={{padding:"10px 32px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Carte</button>
                <button onClick={u2Stand} style={{padding:"10px 32px",background:"transparent",color:"#F5F0E8",border:"2px solid rgba(201,168,76,0.3)",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Stop</button>
                {canSplit2()&&(<button onClick={u2Split} style={{padding:"10px 32px",background:"rgba(201,168,76,0.15)",color:"#C9A84C",border:"2px solid rgba(201,168,76,0.4)",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Split</button>)}
              </div>
            </div>
          )}
          {dealerPhase&&step==="dealer"&&(
            <div style={{padding:12,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:4,textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Banque</div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button onClick={dealerHit2} style={{padding:"10px 32px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Carte</button>
                <button onClick={dealerStop2} style={{padding:"10px 32px",background:"transparent",color:"#F5F0E8",border:"2px solid rgba(201,168,76,0.3)",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Stop</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>);
}
