import { useState, useRef, useEffect } from "react";
import { saveSession } from "@/lib/api";
import SimulatorHeader from "@/components/SimulatorHeader";

// â”€â”€ ENGINE â”€â”€
const SUITS=["â™ ","â™¥","â™¦","â™£"],SC={"â™ ":"#1a1a1a","â™¥":"#C62828","â™¦":"#C62828","â™£":"#1a1a1a"};
const RANKS=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const TABLES=[{id:1,min:20,max:2000,step:10},{id:2,min:50,max:5000,step:10}];
const SEATS=["Place 1","Place 2","Place 3","Place 4","Place 5","Place 6","Place 7"];

function mkDeck(n=6){const d=[];for(let x=0;x<n;x++)for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,id:`${r}${s}${x}${Math.random()}`});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function cv(c){if(["J","Q","K"].includes(c.rank))return 10;if(c.rank==="A")return 11;return parseInt(c.rank);}
function ht(cards){let t=cards.reduce((s,c)=>s+cv(c),0),a=cards.filter(c=>c.rank==="A").length;while(t>21&&a>0){t-=10;a--;}return t;}
function isBJ(cards){return cards.length===2&&ht(cards)===21;}
function isBust(cards){return ht(cards)>21;}
function blazing7s(cards){const sevens=[];for(let i=0;i<Math.min(3,cards.length);i++){if(cards[i].rank==="7")sevens.push(cards[i]);else break;}if(sevens.length===0)return{count:0,pay:0};if(sevens.length===1)return{count:1,pay:10};if(sevens.length===2)return{count:2,pay:125};const allSame=sevens[0].suit===sevens[1].suit&&sevens[1].suit===sevens[2].suit;const sc=s=>s==="â™¥"||s==="â™¦"?"r":"b";const allCol=sc(sevens[0].suit)===sc(sevens[1].suit)&&sc(sevens[1].suit)===sc(sevens[2].suit);if(allSame)return{count:3,pay:"major"};if(allCol)return{count:3,pay:"minor"};return{count:3,pay:1250};}

// â”€â”€ CARD â”€â”€
function Card({card,faceDown=false,size="md"}){
  const S={sm:{w:42,h:60,r:5,fi:12,si:10,ci:18,p:"3px"},md:{w:56,h:80,r:6,fi:16,si:13,ci:24,p:"4px 5px"},lg:{w:66,h:94,r:7,fi:19,si:15,ci:28,p:"5px 6px"}};
  const z=S[size]||S.md;
  if(faceDown)return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"linear-gradient(150deg,#8B1A1A,#5C0E0E 60%,#3D0808)",border:"1.5px solid rgba(201,168,76,0.45)",boxShadow:"0 4px 16px rgba(0,0,0,0.5)",flexShrink:0,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:3,borderRadius:z.r-1,border:"1px solid rgba(201,168,76,0.18)",background:"repeating-conic-gradient(rgba(201,168,76,0.04) 0% 25%,transparent 0% 50%) 0 0/6px 6px"}}/></div>);
  const col=SC[card.suit];
  return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"#fff",color:col,border:"1.5px solid #bbb",padding:z.p,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 3px 12px rgba(0,0,0,0.2),0 1px 2px rgba(0,0,0,0.1)",fontFamily:"'Playfair Display',serif",flexShrink:0,position:"relative"}}><div style={{lineHeight:1,display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div><div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:z.ci,lineHeight:1}}>{card.suit}</div><div style={{lineHeight:1,alignSelf:"flex-end",transform:"rotate(180deg)",display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div></div>);
}
function Chip({amount,size=26}){if(!amount||amount<=0)return null;const cm=[[1000,"#C9A84C"],[500,"#E65100"],[100,"#1a1a1a"],[50,"#1565C0"],[20,"#2E7D46"],[10,"#888"],[5,"#C62828"]];const c=cm.find(([v])=>v<=amount)||cm[cm.length-1];return <div style={{width:size,height:size,borderRadius:"50%",border:`3px solid ${c[1]}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size<=24?7:8,fontWeight:800,color:"#222",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}>{amount}</div>;}
function LED({on}){return <div style={{width:10,height:10,borderRadius:"50%",background:on?"#ff1a1a":"#2a2a2a",boxShadow:on?"0 0 6px #ff1a1a,0 0 14px rgba(255,26,26,0.3)":"inset 0 1px 2px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>;}

// â”€â”€ PLAYER BOX â”€â”€
function BJBox({p,idx,showCards,highlight,hideChips,width=120,cardSize="sm"}){
  const emptyHeight = width <= 100 ? 116 : width <= 118 ? 124 : 136;
  const stackTop = cardSize === "md" ? 20 : 18;
  const stackLeft = cardSize === "md" ? 8 : 6;
  const baseHeight = cardSize === "md" ? 80 : 60;
  const baseWidth = cardSize === "md" ? 56 : 46;
  if(!p.active)return(<div style={{width,padding:"10px 6px",borderRadius:20,border:"2px dashed rgba(201,168,76,0.06)",opacity:0.15,textAlign:"center",minHeight:emptyHeight,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.08)"}}><span style={{fontSize:8,color:"#BFB9AD"}}>VIDE</span></div>);
  const reveal=showCards||p.resolved;
  return(
    <div style={{width,borderRadius:20,border:highlight?"2px solid rgba(201,168,76,0.45)":"2px solid rgba(201,168,76,0.1)",background:highlight?"rgba(201,168,76,0.05)":"rgba(0,0,0,0.1)",padding:"7px 5px",transition:"all 0.3s"}}>
      <div style={{textAlign:"center",marginBottom:3}}><span style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(201,168,76,0.5)"}}>{SEATS[idx]}</span></div>
      {!hideChips&&p.bet>0&&(<div style={{display:"flex",justifyContent:"center",marginBottom:4}}><Chip amount={p.bet} size={24}/></div>)}
      <div style={{display:"flex",justifyContent:"center",marginBottom:3}}>
        <div style={{position:"relative",height:p.cards.length>0?baseHeight+(p.cards.length-1)*stackTop:baseHeight,width:baseWidth+(p.cards.length-1)*stackLeft}}>
          {p.cards.map((c,i)=>(<div key={c.id} style={{position:"absolute",top:i*stackTop,left:i*stackLeft,zIndex:i}}><Card card={c} faceDown={!reveal} size={cardSize}/></div>))}
        </div>
      </div>
      {!hideChips&&(<div style={{display:"flex",justifyContent:"center",marginBottom:2}}><LED on={p.blazing}/></div>)}
      {p.resultText&&(<div style={{textAlign:"center",fontSize:8,fontWeight:800,letterSpacing:"0.1em",color:p.resultText==="BJ 3:2"||p.resultText==="GAGNE"?"#2E7D46":p.resultText==="PERD"||p.resultText==="BUST"?"#C62828":"#C9A84C",borderTop:"1px solid rgba(201,168,76,0.04)",paddingTop:2}}>{p.resultText}</div>)}
      {p.blazingWin>0&&(<div style={{textAlign:"center",fontSize:7,fontWeight:700,color:"#ff4444",marginTop:1}}>ðŸ”¥ +{p.blazingWin}â‚¬</div>)}
    </div>);
}

// â”€â”€ MAIN â”€â”€
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
  const [dealerPhase,setDealerPhase]=useState(false); // true = dealer's turn, user decides carte/stop
  const [insuranceOffered,setInsuranceOffered]=useState(false);
  const [stats,setStats]=useState({rounds:0,score:0,ok:0,total:0});
  // L3: BJ calc
  const [l3Num,setL3Num]=useState(0);
  const [l3Input,setL3Input]=useState("");
  const [l3Comp,setL3Comp]=useState(false); // competition mode
  const [l3Timer,setL3Timer]=useState(7);
  const [l3TimeLeft,setL3TimeLeft]=useState(0);
  const [l3Round,setL3Round]=useState(0);
  const [l3Errors,setL3Errors]=useState([]); // {num, expected, given}
  const [l3Done,setL3Done]=useState(false);
  const l3Ref=useRef(null);
  const timerRef=useRef(null);
  const [viewportWidth,setViewportWidth]=useState(1440);
  const lastSavedHandRef=useRef(0);
  const lastSnapshotRef=useRef({ score: 0, ok: 0, total: 0 });
  const lastSavedL3Ref=useRef("");

  useEffect(()=>{
    const updateViewport=()=>setViewportWidth(window.innerWidth||1440);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return ()=>window.removeEventListener("resize", updateViewport);
  },[]);

  const isMobile = viewportWidth <= 640;
  const isTablet = viewportWidth > 640 && viewportWidth < 1024;
  const isDesktop = viewportWidth >= 1024;
  const isDesktopWide = viewportWidth >= 1440;
  const stagePlayerWidth = viewportWidth <= 430 ? 94 : viewportWidth <= 640 ? 102 : viewportWidth <= 860 ? 110 : viewportWidth >= 1500 ? 134 : viewportWidth >= 1200 ? 124 : 116;
  const stagePlayerCardSize = viewportWidth >= 1500 ? "md" : "sm";
  const dealerCardSize = viewportWidth >= 1400 ? "lg" : viewportWidth >= 768 ? "md" : "sm";
  const sessionAccuracy = stats.total > 0 ? Math.round((stats.ok / stats.total) * 100) : 0;

  const persistBlackjackSession = async ({ mode, score, accuracy, roundsPlayed, roundsCorrect, durationSeconds = 0, errors = [], details = {} }) => {
    await saveSession({
      game_id: "blackjack",
      mode,
      score,
      accuracy,
      duration_seconds: durationSeconds,
      rounds_played: roundsPlayed,
      rounds_correct: roundsCorrect,
      errors,
      details: {
        difficulty: diff,
        table_min: table?.min || null,
        table_max: table?.max || null,
        ...details,
      },
    }).catch(() => null);
  };

  useEffect(() => {
    if (phase !== "l1" || !l1Result) return;

    const isCorrect = l1Result === "ok";
    persistBlackjackSession({
      mode: "guidee",
      score: isCorrect ? 15 : 0,
      accuracy: isCorrect ? 100 : 0,
      roundsPlayed: 1,
      roundsCorrect: isCorrect ? 1 : 0,
      errors: isCorrect ? [] : [`Total obtenu: ${ht(l1Cards)}`],
      details: {
        level: "addition",
        hand_total: ht(l1Cards),
        cards: l1Cards.map((card) => `${card.rank}${card.suit}`),
        result: l1Result,
      },
    });
    lastSnapshotRef.current = { score: stats.score, ok: stats.ok, total: stats.total };
  }, [l1Cards, l1Result, phase, stats]);

  useEffect(() => {
    if (stats.rounds <= lastSavedHandRef.current || phase !== "resolved" || diff !== 2) return;

    const deltaScore = stats.score - lastSnapshotRef.current.score;
    const deltaOk = stats.ok - lastSnapshotRef.current.ok;
    const deltaTotal = stats.total - lastSnapshotRef.current.total;
    const accuracy = deltaTotal > 0 ? Math.round((deltaOk / deltaTotal) * 100) : 0;
    const roundsCorrect = players.filter((player) => ["GAGNE", "BJ 3:2", "PUSH"].includes(player.resultText)).length;

    lastSavedHandRef.current = stats.rounds;
    lastSnapshotRef.current = { score: stats.score, ok: stats.ok, total: stats.total };

    persistBlackjackSession({
      mode: "simulation",
      score: Math.max(0, deltaScore),
      accuracy,
      roundsPlayed: players.filter((player) => player.active).length || 1,
      roundsCorrect,
      details: {
        level: "entrainement",
        dealer_total: ht(dealerCards),
        dealer_cards: dealerCards.map((card) => `${card.rank}${card.suit}`),
        seats: players.map((player, index) => ({
          seat: SEATS[index],
          total: ht(player.cards),
          result: player.resultText,
          cards: player.cards.map((card) => `${card.rank}${card.suit}`),
        })),
      },
    });
  }, [dealerCards, diff, phase, players, stats]);

  useEffect(() => {
    if (phase !== "l3" || !l3Done) return;

    const signature = `${l3Comp}-${l3Round}-${l3Errors.length}-${stats.score}-${stats.total}`;
    if (signature === lastSavedL3Ref.current) return;
    lastSavedL3Ref.current = signature;

    const roundsPlayed = l3Comp ? Math.max(l3Round, 1) : Math.max(stats.total - lastSnapshotRef.current.total, 1);
    const roundsCorrect = l3Comp ? Math.max(0, roundsPlayed - l3Errors.length) : Math.max(0, stats.ok - lastSnapshotRef.current.ok);
    const accuracy = roundsPlayed > 0 ? Math.round((roundsCorrect / roundsPlayed) * 100) : 0;

    persistBlackjackSession({
      mode: l3Comp ? "examen" : "guidee",
      score: Math.max(0, stats.score - lastSnapshotRef.current.score),
      accuracy,
      roundsPlayed,
      roundsCorrect,
      durationSeconds: l3Comp ? (l3Timer * roundsPlayed) : 0,
      errors: l3Errors.map((item) => `${item.num} => ${item.given}/${item.expected}`),
      details: {
        level: "blackjack-payout",
        competition: l3Comp,
        rounds: roundsPlayed,
        timer_seconds: l3Comp ? l3Timer : null,
      },
    });

    lastSnapshotRef.current = { score: stats.score, ok: stats.ok, total: stats.total };
  }, [diff, l3Comp, l3Done, l3Errors, l3Round, l3Timer, phase, stats]);

  // â•â• LEVEL 1: Addition â•â•
  const L1_RANKS=["A","2","3","4","5","6","7","8","9"];
  const mkL1Deck=()=>{const d=[];for(let x=0;x<6;x++)for(const s of SUITS)for(const r of L1_RANKS)d.push({rank:r,suit:s,id:`${r}${s}${x}${Math.random()}`});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;};
  const l1Deal=()=>{const d=mkL1Deck();setL1Cards([d[0],d[1]]);setDeck(d.slice(2));setL1Done(false);setL1Result("");setPhase("l1");};
  const l1Hit=()=>{if(l1Done)return;const nc=[...l1Cards,deck[0]];setL1Cards(nc);setDeck(d=>d.slice(1));if(ht(nc)>21){setL1Done(true);setL1Result("fail");setStats(s=>({...s,total:s.total+1}));setTimeout(()=>l1Deal(),1200);}};
  const l1Stand=()=>{if(l1Done)return;const t=ht(l1Cards);if(t>=17&&t<=21){setL1Done(true);setL1Result("ok");setStats(s=>({...s,score:s.score+15,ok:s.ok+1,total:s.total+1,rounds:s.rounds+1}));setTimeout(()=>l1Deal(),1200);}else{setL1Done(true);setL1Result("fail");setStats(s=>({...s,total:s.total+1}));setTimeout(()=>l1Deal(),1200);}};

  // â•â• LEVEL 2: Entrainement â•â•
  const deal2=(tbl)=>{
    const t=tbl||table;if(!t)return;const d=mkDeck(6);let idx=0;
    const np=[];for(let s=0;s<7;s++){const c1=d[idx++],c2=d[idx++];np.push({active:true,cards:[c1,c2],bet:0,blazing:false,blazingWin:0,resolved:false,resultText:"",insurance:false});}
    const dc=[d[idx++]];
    setDeck(d.slice(idx));setDealerCards(dc);setPlayers(np);setDealerPhase(false);
    const dealerUp=dc[0];
    if(dealerUp.rank==="A"){setInsuranceOffered(true);setStep("insurance");}
    else{
      const cv10=cv(dealerUp)===10;
      if(!cv10){const up=np.map(p=>isBJ(p.cards)?{...p,resolved:true,resultText:"BJ 3:2"}:p);setPlayers(up);}
      setStep("play");setActiveBox(np.findIndex((p,i)=>!isBJ(np[i]?.cards)));
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
      setStep("play");setActiveBox(up.findIndex(p=>!p.resolved));
    }
  };
  const u2Hit=()=>{
    const i=activeBox;if(i<0||i>=7)return;const card=deck[0];const np=[...players];np[i]={...np[i],cards:[...np[i].cards,card]};setDeck(d=>d.slice(1));
    const t=ht(np[i].cards);
    if(t>21){np[i]={...np[i],resolved:true,resultText:"BUST"};setPlayers(np);goNext2(np,i);}
    else if(t===21){np[i]={...np[i],resolved:true};setPlayers(np);goNext2(np,i);}
    else setPlayers(np);
  };
  const u2Stand=()=>{const i=activeBox;const np=[...players];np[i]={...np[i],resolved:true};setPlayers(np);goNext2(np,i);};
  const goNext2=(np,cur)=>{let n=cur+1;while(n<7&&np[n]?.resolved)n++;if(n>=7){setDealerPhase(true);setStep("dealer");dealerDraw2();}else setActiveBox(n);};

  // Dealer: user chooses carte/stop
  const dealerDraw2=()=>{
    if(dealerCards.length===1){const dc2=[...dealerCards,deck[0]];setDealerCards(dc2);setDeck(d=>d.slice(1));}
    setDealerPhase(true);
  };
  const dealerHit2=()=>{const dc=[...dealerCards,deck[0]];setDealerCards(dc);setDeck(d=>d.slice(1));if(ht(dc)>21)resolveFinal2(dc);};
  const dealerStop2=()=>{resolveFinal2(dealerCards);};
  const resolveFinal2=(dc)=>{
    const dt=ht(dc);const dBust=dt>21;const dBJ2=isBJ(dc);
    const up=players.map(p=>{
      if(!p.active||p.resultText==="BJ 3:2"||p.resultText==="BUST"||p.resultText==="PERD"||p.resultText==="PUSH")return p;
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
    // Auto new hand after 2s
    setTimeout(()=>deal2(),2000);
  };

  // â•â• LEVEL 3: Calcul BJ (x1.5) â•â•
  const genL3=()=>{return (Math.floor(Math.random()*199)+2)*10;}; // 20-2000 multiples of 10
  const startL3=()=>{const n=genL3();setL3Num(n);setL3Input("");setL3Round(1);setL3Errors([]);setL3Done(false);setPhase("l3");setTimeout(()=>l3Ref.current?.focus(),100);};
  const startL3Comp=(timer)=>{setL3Comp(true);setL3Timer(timer);const n=genL3();setL3Num(n);setL3Input("");setL3Round(1);setL3Errors([]);setL3Done(false);setL3TimeLeft(timer);setPhase("l3");setTimeout(()=>l3Ref.current?.focus(),100);};

  // Timer for competition
  useEffect(()=>{
    if(phase!=="l3"||!l3Comp||l3Done)return;
    if(timerRef.current)clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      setL3TimeLeft(t=>{
        if(t<=1){
          // Time's up â€” count as error
          setL3Errors(e=>[...e,{num:l3Num,expected:Math.round(l3Num*1.5),given:"â±ï¸"}]);
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

  const submitL3=()=>{
    const v=parseInt(l3Input);const expected=Math.round(l3Num*1.5);const ok=v===expected;
    setStats(s=>({...s,score:s.score+(ok?10:0),ok:s.ok+(ok?1:0),total:s.total+1}));
    if(!ok){
      if(l3Comp){
        setL3Errors(e=>[...e,{num:l3Num,expected,given:v||"?"}]);
        if(l3Round>=50){setL3Done(true);if(timerRef.current)clearInterval(timerRef.current);return;}
        const nn=genL3();setL3Num(nn);setL3Input("");setL3Round(r=>r+1);setL3TimeLeft(l3Timer);
      }else{
        // Free mode: stay on same number, just clear input
        setL3Input("");
      }
      setTimeout(()=>l3Ref.current?.focus(),50);
      return;
    }
    // Correct
    if(l3Comp&&l3Round>=50){setL3Done(true);if(timerRef.current)clearInterval(timerRef.current);return;}
    const nn=genL3();setL3Num(nn);setL3Input("");
    if(l3Comp){setL3Round(r=>r+1);setL3TimeLeft(l3Timer);}
    else setL3Round(r=>r+1);
    setTimeout(()=>l3Ref.current?.focus(),50);
  };

  // â•â• MENU â•â•
  if(screen==="menu")return(
    <div className="cp-sim-shell cp-sim-page">
      <div style={{position:"fixed",inset:0,opacity:0.02,pointerEvents:"none",zIndex:9999,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>
      <SimulatorHeader badge="Blackjack" title="Blackjack" />
      <div className="cp-sim-menu-shell">
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>Simulateur Croupier</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,lineHeight:1.15,margin:0}}><span style={{color:"#C9A84C",fontStyle:"italic"}}>Blackjack</span></h1>
          <p className="cp-sim-menu-copy">Choisis une table et un mode de travail selon l'objectif du moment: automatiser les totaux, tenir une main complete ou reviser les paiements de blackjack.</p>
        </div>
        <div className="cp-sim-menu-grid">
          <div className="cp-sim-info-card" style={{background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02))"}}>
            <div className="cp-sim-section-kicker">Progressif</div>
            <div className="cp-sim-section-title" style={{marginTop:8}}>Blazing 7s</div>
            <div className="cp-sim-section-copy" style={{marginTop:10}}>Le module conserve une logique table: side bet visible, resolution de main et lecture rapide des etats de jeu.</div>
            <div className="cp-sim-meta-strip" style={{marginTop:16}}>
              <div className="cp-sim-meta-card"><strong>{jackpot.toLocaleString("fr-FR")}€</strong><span>Major</span></div>
              <div className="cp-sim-meta-card"><strong>{minorJp.toLocaleString("fr-FR")}€</strong><span>Minor</span></div>
            </div>
          </div>
          <div className="cp-sim-info-card">
            <div className="cp-sim-section-kicker">Tables</div>
            <div className="cp-sim-section-copy" style={{marginTop:10}}>Choisis une plage de mise realiste pour calibrer les mains et les paiements du module.</div>
            <div className="cp-sim-button-grid" style={{marginTop:16}}>
              {TABLES.map(t=>(<div key={t.id} onClick={()=>{setTable(t);setScreen("game");if(diff===1)setTimeout(()=>l1Deal(),50);else if(diff===2)setTimeout(()=>deal2(t),50);else setTimeout(()=>startL3(),50);}} style={{padding:"16px 14px",background:"var(--sim-surface)",border:"1px solid var(--sim-border)",borderRadius:14,cursor:"pointer",textAlign:"center"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.35)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--sim-border)";}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:"#C9A84C"}}>{t.min}€</div><div style={{fontSize:11,color:"var(--sim-muted)",marginTop:4}}>Max {t.max}€</div></div>))}
            </div>
          </div>
          <div className="cp-sim-info-card cp-sim-info-card-muted">
            <div className="cp-sim-section-kicker">Niveaux</div>
            <div className="cp-sim-section-copy" style={{marginTop:10}}>Chaque niveau cible un usage distinct: vitesse de calcul, tenue de table ou paiement blackjack.</div>
            <div className="cp-sim-button-grid" style={{marginTop:16}}>
              {[{d:1,l:"Addition"},{d:2,l:"Entrainement"},{d:3,l:"Calcul de Blackjack"}].map(({d,l})=>(<div key={d} onClick={()=>setDiff(d)} style={{padding:"14px 16px",background:diff===d?"rgba(201,168,76,0.1)":"var(--sim-surface)",border:diff===d?"2px solid #C9A84C":"1px solid var(--sim-border)",borderRadius:14,cursor:"pointer",textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:900,color:diff===d?"#C9A84C":"var(--sim-muted)"}}>{d}</div><div style={{fontSize:11,color:"var(--sim-muted)",marginTop:4}}>{l}</div></div>))}
            </div>
          </div>
        </div>
      </div>
    </div>);

  // Header component
  const Hdr=({label})=>(<SimulatorHeader badge={label} title="Blackjack" stats={`Score ${stats.score}${stats.total>0?` · ${sessionAccuracy}% de precision`:""}`} onBackToMenu={()=>{setScreen("menu");setPhase("idle");setInsuranceOffered(false);setDealerPhase(false);if(timerRef.current)clearInterval(timerRef.current);}} />);

  // â•â• LEVEL 1: Addition â•â•
  if(phase==="l1")return(
    <div className="cp-sim-shell cp-sim-page">
      <Hdr label="Addition"/>
      <div className="cp-sim-main-narrow" style={{textAlign:"center"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C9A84C",marginBottom:16}}>Arrete-toi entre 17 et 21 · l'As vaut 1 ou 11</div>
        <div className="cp-sim-stage cp-sim-stage-rect" style={{padding:isMobile?"24px 14px":"36px 28px",minHeight:isMobile?260:320,display:"grid",placeItems:"center"}}>
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:8,flexWrap:"wrap"}}>{l1Cards.map(c=><Card key={c.id} card={c} size="lg"/>)}</div>
        </div>
        <div style={{marginTop:20}}>
          {l1Result==="ok"?(<div style={{fontSize:18,fontWeight:700,color:"#2E7D46"}}>OK</div>):l1Result==="fail"?(<div style={{fontSize:18,fontWeight:700,color:"#C62828"}}>KO</div>):(
            <div style={{display:"grid",gap:10,gridTemplateColumns:isMobile?"1fr":"repeat(2, minmax(0, 220px))",justifyContent:"center"}}>
              <button onClick={l1Hit} style={{padding:"12px 36px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:10,fontSize:13,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>Carte</button>
              <button onClick={l1Stand} style={{padding:"12px 36px",background:"transparent",color:"#F5F0E8",border:"2px solid rgba(201,168,76,0.3)",borderRadius:10,fontSize:13,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>Stop</button>
            </div>)}
        </div>
      </div>
    </div>);
  // â•â• LEVEL 3: Calcul de BJ â•â•
  if(phase==="l3")return(
    <div className="cp-sim-shell cp-sim-page">
      <Hdr label="Calcul de Blackjack"/>
      <div className="cp-sim-main-narrow" style={{textAlign:"center"}}>
        {!l3Done?(
          <>
            {l3Comp&&<div style={{fontSize:10,fontWeight:700,color:"#C9A84C",marginBottom:6}}>CompÃ©tition â€” {l3Round}/50 Â· â±ï¸ {l3TimeLeft}s</div>}
            {!l3Comp&&<div style={{fontSize:10,fontWeight:700,color:"#C9A84C",marginBottom:6}}>Calcule Ã— 1.5 (paiement BJ 3:2)</div>}
            <div style={{background:"radial-gradient(ellipse,#1A6B4F,#0F3D1F)",borderRadius:16,padding:"40px 24px",border:"3px solid rgba(201,168,76,0.15)",marginBottom:20}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:900,color:"#F5F0E8"}}>{l3Num}â‚¬</div>
              <div style={{fontSize:11,color:"rgba(201,168,76,0.5)",marginTop:4}}>Ã— 1.5 = ?</div>
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>
              <input ref={l3Ref} type="number" value={l3Input} onChange={e=>setL3Input(e.target.value)} onKeyDown={e=>e.key==="Enter"&&l3Input.trim()&&submitL3()} placeholder="RÃ©sultat" style={{width:160,padding:"10px 14px",background:"#0a0a0a",border:"1px solid rgba(201,168,76,0.2)",borderRadius:4,color:"#F5F0E8",fontSize:20,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center"}} autoFocus/>
              <button onClick={()=>l3Input.trim()&&submitL3()} disabled={!l3Input.trim()} style={{padding:"10px 24px",background:l3Input.trim()?"#C9A84C":"#333",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,cursor:l3Input.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>OK</button>
            </div>
            {!l3Comp&&(
              <div style={{marginTop:24,borderTop:"1px solid rgba(201,168,76,0.08)",paddingTop:16}}>
                <div style={{fontSize:9,fontWeight:700,color:"#BFB9AD",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Mode CompÃ©tition</div>
                <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  {[5,7,10].map(t=>(<button key={t} onClick={()=>startL3Comp(t)} style={{padding:"8px 18px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:3,color:"#C9A84C",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t}s Â· 50 rounds</button>))}
                </div>
              </div>
            )}
          </>
        ):(
          // Competition recap
          <div>
            <div style={{fontSize:16,fontWeight:900,fontFamily:"'Playfair Display',serif",color:"#C9A84C",marginBottom:12}}>RÃ©capitulatif</div>
            <div style={{fontSize:13,color:"#BFB9AD",marginBottom:16}}>{50-l3Errors.length}/50 corrects Â· {l3Errors.length} erreurs</div>
            {l3Errors.length>0&&(
              <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.08)",borderRadius:6,padding:12,maxHeight:300,overflowY:"auto",textAlign:"left"}}>
                {l3Errors.map((e,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",fontSize:11,color:"#BFB9AD"}}><span>{e.num}â‚¬ Ã— 1.5</span><span style={{color:"#C62828"}}>{e.given} <span style={{color:"#888"}}>â†’</span> <span style={{color:"#2E7D46"}}>{e.expected}â‚¬</span></span></div>))}
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

  // â•â• LEVEL 2: Entrainement (game) â•â•
  if(!table)return null;
  const dealerShow=step==="dealer"||step==="resolve"||phase==="resolved";

  return(
    <div className="cp-sim-shell cp-sim-page">
      <Hdr label="EntraÃ®nement"/>
      <div className="cp-sim-main cp-sim-stage-layout" style={{gridTemplateColumns:isDesktop?"minmax(0,1.9fr) minmax(340px,0.82fr)":"1fr"}}>
        <div className="cp-sim-stage cp-sim-stage-oval" style={{padding:isMobile?"18px 10px 28px":isTablet?"24px 18px 36px":"30px 30px 48px",minHeight:isMobile?430:isDesktopWide?700:580}}>
          <div style={{position:"absolute",top:"42%",left:"50%",transform:"translate(-50%,-50%)",fontSize:16,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(201,168,76,0.03)",fontFamily:"'Playfair Display',serif",whiteSpace:"nowrap",pointerEvents:"none"}}>BLACKJACK</div>
          {/* PLAYERS */}
          <div style={{display:"flex",justifyContent:"center",gap:isMobile?6:10,flexWrap:"wrap",marginBottom:isMobile?28:42,position:"relative",zIndex:2,alignItems:"flex-start"}}>
            {players.map((p,i)=><BJBox key={i} p={p} idx={i} showCards={true} highlight={i===activeBox&&step==="play"} hideChips={true} width={stagePlayerWidth} cardSize={stagePlayerCardSize}/>)}
          </div>
          {/* Insurance */}
          {insuranceOffered&&(<div style={{textAlign:"center",margin:"12px auto 18px",padding:12,background:"rgba(0,0,0,0.32)",borderRadius:14,border:"1px solid rgba(201,168,76,0.2)",width:"min(100%, 420px)"}}><div style={{fontSize:11,fontWeight:700,color:"#C9A84C",marginBottom:6}}>INSURANCE ?</div><div style={{display:"grid",gap:8,gridTemplateColumns:isMobile?"1fr":"repeat(2, minmax(0, 1fr))"}}><button onClick={()=>handleIns2(true)} style={{padding:"10px 20px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:10,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>Oui</button><button onClick={()=>handleIns2(false)} style={{padding:"10px 20px",background:"transparent",color:"#F5F0E8",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>Non</button></div></div>)}
          {/* DEALER */}
          <div style={{textAlign:"center",marginTop:isMobile?8:14,position:"relative",zIndex:2}}>
            <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(201,168,76,0.4)",marginBottom:4}}>Banque</div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>
              {dealerCards.map((c,i)=><Card key={c.id} card={c} faceDown={i>=1&&!dealerShow} size={dealerCardSize}/>)}
            </div>
          </div>
        </div>
        {/* CONTROLS */}
        <div className={`cp-sim-side-stack${isDesktop ? " cp-sim-sticky-stack" : ""}`}>
          <div className="cp-sim-info-card">
            <div className="cp-sim-section-kicker">Session</div>
            <div className="cp-sim-section-title" style={{marginTop:8}}>{table.min}€ - {table.max}€</div>
            <div className="cp-sim-meta-strip" style={{marginTop:16}}>
              <div className="cp-sim-meta-card"><strong>{stats.score}</strong><span>Score</span></div>
              <div className="cp-sim-meta-card"><strong>{sessionAccuracy}%</strong><span>Precision</span></div>
              <div className="cp-sim-meta-card"><strong>{stats.rounds}</strong><span>Mains</span></div>
            </div>
          </div>
          {step==="play"&&activeBox>=0&&activeBox<7&&players[activeBox]&&!players[activeBox].resolved&&!insuranceOffered&&(
            <div className="cp-sim-control-panel" style={{textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{SEATS[activeBox]}</div>
              <div style={{display:"grid",gap:10,gridTemplateColumns:isMobile?"1fr":"repeat(2, minmax(0, 1fr))"}}>
                <button onClick={u2Hit} style={{padding:"12px 24px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:12,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>Carte</button>
                <button onClick={u2Stand} style={{padding:"12px 24px",background:"transparent",color:"#F5F0E8",border:"2px solid rgba(201,168,76,0.3)",borderRadius:12,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>Stop</button>
              </div>
            </div>
          )}
          {dealerPhase&&step==="dealer"&&(
            <div className="cp-sim-control-panel" style={{textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Banque</div>
              <div style={{display:"grid",gap:10,gridTemplateColumns:isMobile?"1fr":"repeat(2, minmax(0, 1fr))"}}>
                <button onClick={dealerHit2} style={{padding:"12px 24px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:12,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>Carte</button>
                <button onClick={dealerStop2} style={{padding:"12px 24px",background:"transparent",color:"#F5F0E8",border:"2px solid rgba(201,168,76,0.3)",borderRadius:12,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>Stop</button>
              </div>
            </div>
          )}
          <div className="cp-sim-feedback-panel">
            <div className="cp-sim-section-kicker">Cadre de travail</div>
            <div className="cp-sim-section-copy" style={{marginTop:10}}>
              Le plateau occupe davantage l ecran sur desktop, tandis que les actions critiques restent dans une colonne laterale stable et accessible.
            </div>
          </div>
        </div>
      </div>
    </div>);
}

