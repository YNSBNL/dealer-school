import { useState, useEffect, useRef } from "react";
import { saveSession } from "@/lib/api";
import SimulatorHeader from "@/components/SimulatorHeader";
import { dealRound as dealUltimateRound } from "@/features/ultimate-texas/engine";
import { toSuitColor as resolveSuitColor, toSuitSymbol as resolveSuitSymbol } from "@/features/ultimate-texas/selectors";

// ── ENGINE ──
const SUITS=["♠","♥","♦","♣"],SC={"♠":"#1a1a1a","♥":"#C62828","♦":"#C62828","♣":"#1a1a1a"};
const RANKS=["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const RV={"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14};
const HN={9:"Quinte Flush Royale",8:"Quinte Flush",7:"Carré",6:"Full",5:"Couleur",4:"Suite",3:"Brelan",2:"Deux Paires",1:"Paire",0:"Carte Haute"};
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
function pContrib(pc,cc,hr){
  // Board alone or with any player cards — combo exists anywhere
  const all=[...cc,...pc];
  const e=best7(all);
  return e&&e.rank>=hr;
}

// For BLIND: the winning hand must use at least 1 player card (not just the board)
function blindQualifies(pc,cc,handRank){
  if(handRank<4)return false; // below suite = no blind bonus
  // Check if board alone already has this rank
  const boardEval=best7(cc);
  const boardHasIt=boardEval&&boardEval.rank>=handRank;
  // Check full 7-card hand
  const fullEval=best7([...cc,...pc]);
  const fullHasIt=fullEval&&fullEval.rank>=handRank;
  // If the full hand has it but the board alone doesn't → player contributes
  if(fullHasIt&&!boardHasIt)return true;
  // If board alone has it, check if adding player cards makes it even better
  if(boardHasIt&&fullHasIt&&fullEval.rank>boardEval.rank)return true;
  // If board has same rank but player card improves kickers, still counts
  // But for simplicity: if board alone has the combo, player doesn't contribute
  if(boardHasIt)return false;
  return fullHasIt;
}

// Compute payout for a player (no fold)
// payAmount = total the croupier pays: Jouer + Miser (if qual) + Blind bonus (if combo) + Bonus + Progressive
function calcPayout(p,pEval,dEval,dqual,cc,jackpot){
  const comp=cmpH(pEval,dEval);
  // Bonus: pays if combo exists (board alone counts), independent of win/lose
  const br=BONUS_PT[pEval.rank]||0;
  let bonusPay=0;if(p.bonus>0&&br>0)bonusPay=p.bonus*br;
  // Progressive: pays if combo exists (board alone counts), independent of win/lose
  let progPay=0;
  if(p.progressive&&pEval){
    const pp=PROG_PT[pEval.rank];
    if(pp){if(pp==="jackpot")progPay=jackpot;else progPay=pp;}
  }
  // Main bets payout on win
  let mainPay=0;
  const result=comp>0?"win":comp<0?"lose":"push";
  if(comp>0){
    let jr=p.jouer; // Jouer 1:1
    let mr=dqual?p.miser:0; // Miser 1:1 only if dealer qualifies
    // Blind: only if player's winning hand uses at least 1 of their cards for the combo
    let blr=0;
    if(blindQualifies(p.cards,cc,pEval.rank)){
      const bp=BLIND_PT[pEval.rank]||0;
      blr=bp>0?Math.floor(p.blind*bp):0;
    }
    mainPay=jr+mr+blr;
  }
  const payAmount=mainPay+bonusPay+progPay;
  return{payAmount,result,bonusPay,progPay,mainPay};
}

// ── CARD ──
function Card({card,faceDown=false,size="md"}){
  const S={sm:{w:42,h:60,r:5,fi:12,si:10,ci:18,p:"3px"},md:{w:56,h:80,r:6,fi:16,si:13,ci:24,p:"4px 5px"},lg:{w:66,h:94,r:7,fi:19,si:15,ci:28,p:"5px 6px"}};
  const z=S[size]||S.md;
  if(faceDown)return(
    <div style={{width:z.w,height:z.h,borderRadius:z.r,background:"linear-gradient(150deg,#8B1A1A,#5C0E0E 60%,#3D0808)",border:"1.5px solid rgba(201,168,76,0.45)",boxShadow:"0 4px 16px rgba(0,0,0,0.5)",flexShrink:0,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:3,borderRadius:z.r-1,border:"1px solid rgba(201,168,76,0.18)",background:"repeating-conic-gradient(rgba(201,168,76,0.04) 0% 25%,transparent 0% 50%) 0 0/6px 6px"}}/>
    </div>);
  const suitSymbol = card.suit.length === 1 ? resolveSuitSymbol(card.suit) : card.suit;
  const col = SC[card.suit] || (card.suit.length === 1 ? resolveSuitColor(card.suit) : "#1a1a1a");
  return(
    <div style={{width:z.w,height:z.h,borderRadius:z.r,background:"#fff",color:col,border:"1.5px solid #bbb",padding:z.p,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 3px 12px rgba(0,0,0,0.2),0 1px 2px rgba(0,0,0,0.1)",fontFamily:"'Playfair Display',serif",flexShrink:0,position:"relative"}}>
      <div style={{lineHeight:1,display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}>
        <div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div>
        <div style={{fontSize:z.si,marginTop:-1}}>{suitSymbol}</div>
      </div>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:z.ci,lineHeight:1}}>{suitSymbol}</div>
      <div style={{lineHeight:1,alignSelf:"flex-end",transform:"rotate(180deg)",display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}>
        <div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div>
        <div style={{fontSize:z.si,marginTop:-1}}>{suitSymbol}</div>
      </div>
    </div>);
}
function Chip({amount,size=26}){if(!amount||amount<=0)return null;const cm=[[1000,"#C9A84C"],[500,"#E65100"],[100,"#1a1a1a"],[50,"#1565C0"],[20,"#2E7D46"],[10,"#888"],[5,"#C62828"]];const c=cm.find(([v])=>v<=amount)||cm[cm.length-1];return <div style={{width:size,height:size,borderRadius:"50%",border:`3px solid ${c[1]}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size<=24?7:8,fontWeight:800,color:"#222",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}>{amount}</div>;}
function LED({on}){return <div style={{width:10,height:10,borderRadius:"50%",background:on?"#ff1a1a":"#2a2a2a",boxShadow:on?"0 0 6px #ff1a1a,0 0 14px rgba(255,26,26,0.3)":"inset 0 1px 2px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>;}
function Spot({label,val}){return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,width:32}}><div style={{width:26,height:26,borderRadius:"50%",border:val>0?"2px solid rgba(201,168,76,0.4)":"1.5px dashed rgba(255,255,255,0.08)",background:val>0?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>{val>0&&<Chip amount={val} size={22}/>}</div><span style={{fontSize:6,fontWeight:700,letterSpacing:"0.05em",color:"rgba(201,168,76,0.45)"}}>{label}</span></div>);}

// ── PLAYER BOX — no win/lose/fold display ──
function PlayerBox({p,idx,phase,revealIdx,isL1,showHand,width=138}){
  if(!p.active)return(<div style={{width,padding:"10px 6px",borderRadius:20,border:"2px dashed rgba(201,168,76,0.06)",opacity:0.15,textAlign:"center",minHeight:width <= 108 ? 136 : 160,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.08)"}}><span style={{fontSize:8,color:"#BFB9AD"}}>VIDE</span></div>);
  const reveal=revealIdx===true||revealIdx===idx||phase==="resolved";
  const hl=revealIdx===idx;
  return(
    <div style={{width,borderRadius:20,border:hl?"2px solid rgba(201,168,76,0.45)":"2px solid rgba(201,168,76,0.1)",background:hl?"rgba(201,168,76,0.05)":"rgba(0,0,0,0.1)",padding:"7px 5px",transition:"all 0.3s"}}>
      <div style={{textAlign:"center",marginBottom:3}}><span style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(201,168,76,0.5)"}}>{SEATS[idx]}</span></div>
      <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:4}}>{p.cards.map(c=><Card key={c.id} card={c} faceDown={!reveal} size="sm"/>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"32px 32px",gap:"2px 4px",justifyContent:"center",marginBottom:2}}>
        <div/><Spot label="JOUER" val={p.jouer}/>
        <Spot label="BLIND" val={p.blind}/><Spot label="MISER" val={p.miser}/>
        <div/><Spot label="BONUS" val={p.bonus}/>
      </div>
      {!isL1&&<div style={{display:"flex",justifyContent:"center",marginBottom:2}}><LED on={p.progressive}/></div>}
      {/* Show hand name only after correctly identified */}
      {showHand&&p.eval&&<div style={{textAlign:"center",fontSize:7,color:"#BFB9AD",borderTop:"1px solid rgba(201,168,76,0.04)",paddingTop:2,marginTop:1}}>{HN[p.eval.rank]}</div>}
    </div>);
}

// ── MCQ component ──
function MCQ({question,onAnswer,wrong}){
  return(<div style={{padding:12,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:4}}>
    <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{question}</div>
    {wrong&&<div style={{fontSize:10,color:"#C62828",fontWeight:700,marginBottom:6}}>✗ Essaie encore</div>}
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
  const [phase,setPhase]=useState("idle"); // idle, active, resolved
  const [dEval,setDEval]=useState(null);
  const [dq,setDq]=useState(null);
  const [stats,setStats]=useState({rounds:0,score:0,ok:0,total:0});
  // Step-by-step flow (all levels)
  // steps: "board" → "dealer_hand" → "player_hand" → "player_payout" (L2/L3 only) → next player...
  const [step,setStep]=useState("board");
  const [pIdx,setPIdx]=useState(-1); // current player index
  const [wrong,setWrong]=useState(false);
  const [payInput,setPayInput]=useState("");
  const [payFB,setPayFB]=useState(null); // {ok,exp,got} or null
  const [gameOver,setGameOver]=useState(null); // L3 game over
  const [handFound,setHandFound]=useState(new Set()); // player indexes where hand was correctly identified
  const inpRef=useRef(null);
  const [viewportWidth,setViewportWidth]=useState(1440);
  const lastSavedRoundRef=useRef(0);
  const lastSavedGameOverRef=useRef("");
  const lastSnapshotRef=useRef({ score: 0, ok: 0, total: 0 });

  useEffect(()=>{
    const updateViewport=()=>setViewportWidth(window.innerWidth||1440);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return ()=>window.removeEventListener("resize", updateViewport);
  },[]);

  const isMobile = viewportWidth <= 640;
  const isDesktopWide = viewportWidth >= 1440;
  const playerBoxWidth = viewportWidth <= 430 ? 106 : viewportWidth <= 640 ? 114 : viewportWidth >= 1500 ? 152 : 138;
  const boardCardSize = viewportWidth >= 1400 ? "lg" : viewportWidth >= 768 ? "md" : "sm";

  const persistUltimateSession = async ({ mode, score, accuracy, roundsPlayed, roundsCorrect, errors = [], details = {} }) => {
    await saveSession({
      game_id: "ultimate-texas",
      mode,
      score,
      accuracy,
      duration_seconds: 0,
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
    if (stats.rounds <= lastSavedRoundRef.current || phase !== "resolved") return;

    const deltaScore = stats.score - lastSnapshotRef.current.score;
    const deltaOk = stats.ok - lastSnapshotRef.current.ok;
    const deltaTotal = stats.total - lastSnapshotRef.current.total;
    const accuracy = deltaTotal > 0 ? Math.round((deltaOk / deltaTotal) * 100) : 0;
    const roundsCorrect = players.filter((player) => player.result === "win" || player.result === "push").length;

    lastSavedRoundRef.current = stats.rounds;
    lastSnapshotRef.current = { score: stats.score, ok: stats.ok, total: stats.total };

    persistUltimateSession({
      mode: diff >= 3 ? "examen" : diff === 2 ? "simulation" : "guidee",
      score: Math.max(0, deltaScore),
      accuracy,
      roundsPlayed: players.filter((player) => player.active).length || 1,
      roundsCorrect,
      details: {
        dealer_hand: dEval ? HN[dEval.rank] : null,
        dealer_qualifies: dq,
        board: cc.map((card) => `${card.rank}${card.suit}`),
        dealer_cards: dCards.map((card) => `${card.rank}${card.suit}`),
        seats: players.map((player, index) => ({
          seat: SEATS[index],
          hand: player.eval ? HN[player.eval.rank] : null,
          payout: player.payout || 0,
          result: player.result,
        })),
      },
    });
  }, [cc, dCards, dEval, diff, dq, phase, players, stats]);

  useEffect(() => {
    if (!gameOver) return;

    const signature = `${stats.rounds}-${gameOver.player}-${stats.total}-${stats.score}`;
    if (signature === lastSavedGameOverRef.current) return;
    lastSavedGameOverRef.current = signature;

    const deltaScore = stats.score - lastSnapshotRef.current.score;
    const deltaOk = stats.ok - lastSnapshotRef.current.ok;
    const deltaTotal = stats.total - lastSnapshotRef.current.total;
    const accuracy = deltaTotal > 0 ? Math.round((deltaOk / deltaTotal) * 100) : 0;

    persistUltimateSession({
      mode: "examen",
      score: Math.max(0, deltaScore),
      accuracy,
      roundsPlayed: 1,
      roundsCorrect: 0,
      errors: [gameOver.player],
      details: {
        failure: gameOver.player,
        explanation: gameOver.explain,
      },
    });

    lastSnapshotRef.current = { score: stats.score, ok: stats.ok, total: stats.total };
  }, [gameOver, stats]);

  const deal=(tbl)=>{
    const t=tbl||table;if(!t)return;
    const round = dealUltimateRound(t, diff);
    if(round.jackpotIncrement>0)setJackpot(j=>j+round.jackpotIncrement);
    setDCards(round.dealerCards);setCC(round.board);setPlayers(round.players);
    setDEval(null);setDq(null);
    setStep("board");setPIdx(-1);setWrong(false);setPayInput("");setPayFB(null);setGameOver(null);setHandFound(new Set());
    setPhase("active");
  };

  // Reveal board → show dealer
  const revealDealer=()=>{
    const de=best7([...dCards,...cc]);
    setDEval(de);setDq(dQual(de));setStep("dealer_hand");setWrong(false);
  };

  // Answer dealer hand MCQ
  const answerDealerHand=(ans)=>{
    const ok=ans===HN[dEval.rank];
    if(ok){
      setStats(s=>({...s,score:s.score+15,ok:s.ok+1,total:s.total+1}));
      // Move to first player
      setPIdx(0);setStep("player_hand");setWrong(false);
    }else{
      setWrong(true);setStats(s=>({...s,total:s.total+1}));
    }
  };

  // Answer player hand MCQ
  const answerPlayerHand=(ans)=>{
    const p=players[pIdx];
    const pe=best7([...p.cards,...cc]);
    const ok=ans===HN[pe.rank];
    if(ok){
      setStats(s=>({...s,score:s.score+15,ok:s.ok+1,total:s.total+1}));
      const np=[...players];np[pIdx]={...np[pIdx],eval:pe};setPlayers(np);
      setHandFound(prev=>new Set([...prev,pIdx]));
      if(diff>=2){
        // Compute payout for this player
        const pay=calcPayout(np[pIdx],pe,dEval,dq,cc,jackpot);
        np[pIdx]={...np[pIdx],payout:pay.payAmount,result:pay.result,bonusPay:pay.bonusPay,progPay:pay.progPay};setPlayers(np);
        setStep("player_payout");setPayInput("");setPayFB(null);setWrong(false);
        setTimeout(()=>inpRef.current?.focus(),200);
      }else{
        // L1: just move to next player
        goNextPlayer();
      }
    }else{
      setWrong(true);setStats(s=>({...s,total:s.total+1}));
    }
  };

  // Answer player payout (L2/L3)
  // payAmount includes bonus+prog. If player loses but has bonus/prog, answer is that amount.
  // "Ramasser" = lose AND payout is 0 (no bonus/prog paying)
  // "Egalite" = push AND payout is 0
  // Otherwise: the number
  const answerPayout=(answer)=>{
    const p=players[pIdx];
    const hasPay=p.payout>0;
    let ok=false;
    if(answer==="ramasser"){
      ok=p.result==="lose"&&!hasPay;
    }else if(answer==="egalite"){
      ok=p.result==="push"&&!hasPay;
    }else{
      const v=parseInt(answer);
      ok=!isNaN(v)&&v===p.payout&&hasPay;
    }
    if(ok){
      setPayFB({ok:true});
      setStats(s=>({...s,score:s.score+20,ok:s.ok+1,total:s.total+1}));
      setTimeout(()=>{setPayFB(null);goNextPlayer();},1000);
    }else{
      let expected;
      if(p.result==="lose"&&!hasPay) expected="Ramasser";
      else if(p.result==="push"&&!hasPay) expected="Égalité";
      else expected=`${p.payout}€`;
      if(diff===3){
        let explain=`${SEATS[pIdx]} : ${p.eval?HN[p.eval.rank]:"?"}\n`;
        explain+=`Banque : ${dEval?HN[dEval.rank]:"?"} — ${dq?"Qualifiée":"Non qualifiée (Miser push)"}\n\n`;
        explain+=`Miser ${p.miser}€ · Blind ${p.blind}€ · Bonus ${p.bonus}€ · Jouer ${p.jouer}€ (${p.jouerMult}×)`;
        if(p.progressive)explain+=` · Prog 5€`;
        if(p.bonusPay>0)explain+=`\nBonus gagné : ${p.bonusPay}€`;
        if(p.progPay>0)explain+=`\nProgressif gagné : ${p.progPay}€`;
        explain+=`\n\nRéponse attendue : ${expected}`;
        setGameOver({player:SEATS[pIdx],explain});
        setStats(s=>({...s,total:s.total+1}));
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
    else{setPhase("resolved");setStats(s=>({...s,rounds:s.rounds+1}));}
  };

  // Derived state
  const showDealer=step!=="board";
  const revealedUpTo=pIdx; // players 0..pIdx-1 are revealed, pIdx is current

  // ── MENU ──
  if(screen==="menu")return(
    <div className="cp-sim-shell cp-sim-page">
      <div style={{position:"fixed",inset:0,opacity:0.02,pointerEvents:"none",zIndex:9999,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>
      <SimulatorHeader badge="Ultimate Texas Hold'em" title="Ultimate Texas Hold'em" />
      <div className="cp-sim-menu-shell">
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>Simulateur Croupier</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,lineHeight:1.15,margin:0}}>Ultimate Texas <span style={{color:"#C9A84C",fontStyle:"italic"}}>Hold'em</span></h1>
        </div>
        <p className="cp-sim-menu-copy">Un module plus dense pour travailler la lecture du board, la qualification de la banque et les paiements d'un jeu de poker casino plus exigeant.</p>
        <div className="cp-sim-info-card" style={{background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02))",textAlign:"center",maxWidth:760}}>
          <div style={{fontSize:7,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C9A84C"}}>🏆 Jackpot</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:"#C9A84C"}}>{jackpot.toLocaleString("fr-FR")} €</div>
        </div>
        <div className="cp-sim-info-card cp-sim-info-card-muted" style={{ maxWidth: 760 }}>
          <div style={{textAlign:"center",fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#BFB9AD",marginBottom:6}}>Table</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>{TABLES.map(t=>(<div key={t.id} onClick={()=>{setTable(t);setScreen("game");setTimeout(()=>deal(t),50);}} style={{padding:"12px 14px",background:"var(--sim-surface)",border:"1px solid var(--sim-border)",borderRadius:6,cursor:"pointer",textAlign:"center",minWidth:120,flex:"1 1 120px",maxWidth:180,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.35)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--sim-border)";}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#C9A84C"}}>{t.min}€</div><div style={{fontSize:9,color:"var(--sim-muted)",marginTop:2}}>Max {t.max}€</div></div>))}</div>
        </div>
        <div className="cp-sim-info-card cp-sim-info-card-muted" style={{ maxWidth: 760 }}>
          <div style={{textAlign:"center",fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#BFB9AD",marginBottom:5}}>Niveau</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>{[{d:1,l:"Lecture de board"},{d:2,l:"Paiements"},{d:3,l:"Expert"}].map(({d,l})=>(<div key={d} onClick={()=>setDiff(d)} style={{padding:"8px 16px",background:diff===d?"rgba(201,168,76,0.1)":"var(--sim-surface)",border:diff===d?"2px solid #C9A84C":"1px solid var(--sim-border)",borderRadius:4,cursor:"pointer",textAlign:"center",flex:"1 1 150px",maxWidth:220}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:900,color:diff===d?"#C9A84C":"var(--sim-muted)"}}>{d}</div><div style={{fontSize:8,color:"var(--sim-muted)",marginTop:1}}>{l}</div></div>))}</div>
        </div>
      </div>
    </div>);

  // ── GAME ──
  if(!table)return null;
  const isL1=diff===1;

  return(
    <div className="cp-sim-shell cp-sim-page">
      <SimulatorHeader badge={`UTH · ${table.min}-${table.max}€`} title="Ultimate Texas Hold'em" stats={`Jackpot ${jackpot.toLocaleString("fr-FR")}€ · 🏆${stats.score} · R${stats.rounds+1}${stats.total>0?` · ${Math.round(stats.ok/stats.total*100)}%`:""}`} onBackToMenu={()=>{setScreen("menu");setPhase("idle");}} />
      <div className="cp-sim-main">
        {/* FELT */}
        <div className="cp-sim-stage cp-sim-stage-oval" style={{padding:isMobile?"18px 12px 28px":"20px 22px 34px",minHeight:isDesktopWide?620:470}}>
          <div style={{position:"absolute",top:"45%",left:"50%",transform:"translate(-50%,-50%)",fontSize:14,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(201,168,76,0.03)",fontFamily:"'Playfair Display',serif",whiteSpace:"nowrap",pointerEvents:"none"}}>ULTIMATE TEXAS HOLD'EM</div>
          {/* PLAYERS (top) */}
          <div style={{display:"flex",justifyContent:"center",gap:isMobile?6:8,flexWrap:"wrap",marginBottom:16,position:"relative",zIndex:2}}>
            {players.map((p,i)=><PlayerBox key={i} p={p} idx={i} phase={phase} revealIdx={pIdx>=0&&i<=pIdx?true:false} isL1={isL1} showHand={handFound.has(i)} width={playerBoxWidth}/>)}
          </div>
          {/* BOARD */}
          <div style={{textAlign:"center",margin:"14px 0",position:"relative",zIndex:2}}>
            <div style={{display:"flex",gap:7,justifyContent:"center"}}>
              {cc.map((c,i)=><Card key={c.id} card={c} size={boardCardSize}/>)}
            </div>
          </div>
          {/* DEALER */}
          <div style={{textAlign:"center",marginTop:14,position:"relative",zIndex:2}}>
            <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(201,168,76,0.4)",marginBottom:4}}>Banque</div>
            <div style={{display:"flex",gap:5,justifyContent:"center"}}>
              {dCards.map(c=><Card key={c.id} card={c} faceDown={!showDealer} size={viewportWidth >= 1200 ? "md" : "sm"}/>)}
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{marginTop:8}}>
          {/* Step: board → reveal dealer */}
          {phase==="active"&&step==="board"&&(
            <div style={{padding:12,background:"var(--sim-surface)",border:"1px solid var(--sim-border)",borderRadius:4,textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Board affiché</div>
              <button onClick={revealDealer} style={{padding:"9px 28px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Découvrir la banque →</button>
            </div>
          )}
          {/* Step: dealer hand MCQ */}
          {phase==="active"&&step==="dealer_hand"&&!gameOver&&(
            <MCQ question="🧠 Quel est le jeu de la Banque ?" onAnswer={answerDealerHand} wrong={wrong}/>
          )}
          {/* Step: player hand MCQ */}
          {phase==="active"&&step==="player_hand"&&pIdx>=0&&!gameOver&&(
            <MCQ question={`🧠 Quel est le jeu de ${SEATS[pIdx]} ?`} onAnswer={answerPlayerHand} wrong={wrong}/>
          )}
          {/* Step: player payout (L2/L3) */}
          {phase==="active"&&step==="player_payout"&&pIdx>=0&&!gameOver&&!payFB&&(
            <div style={{padding:12,background:"var(--sim-surface)",border:"1px solid var(--sim-border)",borderRadius:4}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>💰 Paiement {SEATS[pIdx]} — {players[pIdx]?.eval?HN[players[pIdx].eval.rank]:""}</div>
              <div style={{display:"flex",gap:5,marginBottom:8,fontSize:8,color:"#BFB9AD",flexWrap:"wrap"}}>
                <span>Miser:{players[pIdx]?.miser}€</span><span>Blind:{players[pIdx]?.blind}€</span><span>Bonus:{players[pIdx]?.bonus}€</span><span>Jouer:{players[pIdx]?.jouer}€ ({players[pIdx]?.jouerMult}×)</span>
                {players[pIdx]?.progressive&&<span style={{color:"#ff4444"}}>Prog 5€</span>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <button onClick={()=>answerPayout("ramasser")} style={{padding:"8px 18px",background:"rgba(198,40,40,0.1)",border:"1px solid rgba(198,40,40,0.3)",borderRadius:3,color:"#C62828",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Ramasser</button>
                <button onClick={()=>answerPayout("egalite")} style={{padding:"8px 18px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:3,color:"#C9A84C",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Égalité</button>
                <div style={{display:"flex",gap:4,flex:1,minWidth:isMobile?"100%":150,flexWrap:isMobile?"wrap":"nowrap"}}>
                  <input ref={inpRef} type="number" value={payInput} onChange={e=>setPayInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&payInput.trim()&&answerPayout(payInput.trim())} placeholder="Montant à payer" style={{flex:1,padding:"7px 8px",background:"#0a0a0a",border:"1px solid rgba(201,168,76,0.15)",borderRadius:2,color:"#F5F0E8",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none"}} autoFocus/>
                  <button onClick={()=>payInput.trim()&&answerPayout(payInput.trim())} disabled={!payInput.trim()} style={{padding:"7px 14px",background:payInput.trim()?"#C9A84C":"#333",color:"#0A0A0A",border:"none",borderRadius:2,fontSize:9,fontWeight:700,cursor:payInput.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>OK</button>
                </div>
              </div>
            </div>
          )}
          {/* Payout feedback */}
          {payFB&&(
            <div style={{padding:10,background:payFB.ok?"rgba(46,125,70,0.08)":"rgba(198,40,40,0.08)",border:`1px solid ${payFB.ok?"rgba(46,125,70,0.2)":"rgba(198,40,40,0.2)"}`,borderRadius:4,textAlign:"center",marginTop:4}}>
              <div style={{fontSize:11,fontWeight:700,color:payFB.ok?"#2E7D46":"#C62828"}}>{payFB.ok?"✓ Correct !":`✗ Réponse attendue : ${payFB.exp}`}</div>
            </div>
          )}
          {/* Expert game over */}
          {gameOver&&(
            <div style={{padding:16,background:"var(--sim-surface)",border:"2px solid rgba(198,40,40,0.3)",borderRadius:6,marginTop:4}}>
              <div style={{textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:18,fontWeight:900,color:"#C62828",fontFamily:"'Playfair Display',serif",marginBottom:4}}>✗ Partie terminée</div>
                <div style={{fontSize:11,color:"#BFB9AD"}}>Erreur sur <strong style={{color:"#C9A84C"}}>{gameOver.player}</strong></div>
              </div>
              <div style={{background:"rgba(0,0,0,0.12)",borderRadius:4,padding:14,fontSize:11,color:"var(--sim-muted)",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{gameOver.explain}</div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14}}>
                <button onClick={()=>{setGameOver(null);deal();}} style={{padding:"9px 28px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Recommencer →</button>
                <button onClick={()=>{setScreen("menu");setPhase("idle");setGameOver(null);}} style={{padding:"9px 28px",background:"transparent",color:"#BFB9AD",border:"1px solid rgba(255,255,255,0.06)",borderRadius:3,fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Menu</button>
              </div>
            </div>
          )}
          {/* Resolved: new hand */}
          {phase==="resolved"&&!gameOver&&(
            <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:8}}>
              <button onClick={()=>deal()} style={{padding:"9px 28px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Nouvelle main →</button>
              <button onClick={()=>{setScreen("menu");setPhase("idle");}} style={{padding:"9px 28px",background:"transparent",color:"#BFB9AD",border:"1px solid rgba(255,255,255,0.06)",borderRadius:3,fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Menu</button>
            </div>
          )}
        </div>
        {/* PAYTABLES */}
        {diff>=2&&(<div className="cp-sim-auto-grid" style={{marginTop:8}}>
          <div style={{background:"var(--sim-surface)",border:"1px solid var(--sim-border)",borderRadius:3,padding:6}}><div style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#C9A84C",marginBottom:2}}>Bonus</div><div style={{fontSize:7,color:"var(--sim-muted)",lineHeight:1.5}}>Brelan 3x · Suite 4x · Couleur 7x<br/>Full 8x · Carré 30x · QF 40x · QFR 50x</div></div>
          <div style={{background:"var(--sim-surface)",border:"1px solid var(--sim-border)",borderRadius:3,padding:6}}><div style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#C9A84C",marginBottom:2}}>Blind</div><div style={{fontSize:7,color:"var(--sim-muted)",lineHeight:1.5}}>Suite 1x · Couleur 1.5x · Full 3x<br/>Carré 10x · QF 50x · QFR 500x</div></div>
          <div style={{background:"var(--sim-surface)",border:"1px solid var(--sim-border)",borderRadius:3,padding:6}}><div style={{fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#C9A84C",marginBottom:2}}>Progressif (5€)</div><div style={{fontSize:7,color:"var(--sim-muted)",lineHeight:1.5}}>Full 50€ · Carré 500€<br/>QF 1500€ · QFR = <strong style={{color:"#C9A84C"}}>JACKPOT</strong></div></div>
        </div>)}
        <div className="cp-sim-stats-grid" style={{marginTop:5}}>
          {[{n:stats.score,l:"Score"},{n:stats.rounds,l:"Mains"},{n:stats.total>0?`${Math.round(stats.ok/stats.total*100)}%`:"—",l:"Précision"},{n:`${jackpot.toLocaleString("fr-FR")}€`,l:"Jackpot"}].map((s,i)=>(
            <div key={i} style={{background:"var(--sim-surface)",border:"1px solid var(--sim-border)",borderRadius:3,padding:"5px",textAlign:"center"}}>
              <div style={{fontFamily:typeof s.n==="number"?"'Playfair Display',serif":"'DM Sans',sans-serif",fontSize:typeof s.n==="number"?15:9,fontWeight:typeof s.n==="number"?900:700,color:"#C9A84C"}}>{s.n}</div>
              <div style={{fontSize:6,color:"#BFB9AD",letterSpacing:"0.06em",textTransform:"uppercase",marginTop:1}}>{s.l}</div>
            </div>))}
        </div>
      </div>
    </div>);
}
