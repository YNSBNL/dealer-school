import { useState, useRef, useEffect } from "react";
import SimulatorHeader from "@/components/SimulatorHeader";

// ── PLO ENGINE ──
const SUITS=["♠","♥","♦","♣"],SC={"♠":"#1a1a1a","♥":"#C62828","♦":"#C62828","♣":"#1a1a1a"};
const RANKS=["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const RV={"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14};
const POSITIONS_8=["BTN","SB","BB","UTG","UTG+1","MP","HJ","CO"];
const POSITIONS_9=["BTN","SB","BB","UTG","UTG+1","UTG+2","MP","HJ","CO"];
const HN={9:"Quinte Flush Royale",8:"Quinte Flush",7:"Carré",6:"Full",5:"Couleur",4:"Suite",3:"Brelan",2:"Deux Paires",1:"Paire",0:"Carte Haute"};
const TABLES=[{sb:2,bb:4},{sb:5,bb:10},{sb:10,bb:20},{sb:20,bb:40}];

function roundBet(amount,sb){var mult=sb>=10?10:sb>=5?5:2;return Math.round(amount/mult)*mult;}

function mkDeck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,id:`${r}${s}${Math.random()}`});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}

function ev5(c){const v=c.map(x=>RV[x.rank]).sort((a,b)=>b-a),su=c.map(x=>x.suit),fl=su.every(s=>s===su[0]);let st=false,sh=0;const u=[...new Set(v)].sort((a,b)=>b-a);if(u.length>=5){for(let i=0;i<=u.length-5;i++)if(u[i]-u[i+4]===4){st=true;sh=u[i];break;}if(!st&&u.includes(14)&&u.includes(2)&&u.includes(3)&&u.includes(4)&&u.includes(5)){st=true;sh=5;}}const ct={};v.forEach(x=>{ct[x]=(ct[x]||0)+1;});const g=Object.entries(ct).map(([k,c])=>({v:+k,c}));g.sort((a,b)=>b.c-a.c||b.v-a.v);if(fl&&st&&sh===14)return{rank:9,k:[14],name:"Quinte Flush Royale"};if(fl&&st)return{rank:8,k:[sh],name:"Quinte Flush"};if(g[0].c===4)return{rank:7,k:[g[0].v,g[1].v],name:"Carré"};if(g[0].c===3&&g[1].c>=2)return{rank:6,k:[g[0].v,g[1].v],name:"Full"};if(fl)return{rank:5,k:v.slice(0,5),name:"Couleur"};if(st)return{rank:4,k:[sh],name:"Suite"};if(g[0].c===3){const k=g.filter(x=>x.c===1).map(x=>x.v).sort((a,b)=>b-a);return{rank:3,k:[g[0].v,...k.slice(0,2)],name:"Brelan"};}if(g[0].c===2&&g[1].c===2){const k=g.find(x=>x.c===1);return{rank:2,k:[Math.max(g[0].v,g[1].v),Math.min(g[0].v,g[1].v),k?k.v:0],name:"Deux Paires"};}if(g[0].c===2){const k=g.filter(x=>x.c===1).map(x=>x.v).sort((a,b)=>b-a);return{rank:1,k:[g[0].v,...k.slice(0,3)],name:"Paire"};}return{rank:0,k:v.slice(0,5),name:"Carte Haute"};}
function cmpH(a,b){if(!a&&!b)return 0;if(!a)return -1;if(!b)return 1;if(a.rank!==b.rank)return a.rank-b.rank;for(let i=0;i<Math.min(a.k.length,b.k.length);i++)if(a.k[i]!==b.k[i])return a.k[i]-b.k[i];return 0;}

function combos2(arr){const r=[];for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++)r.push([arr[i],arr[j]]);return r;}
function combos3(arr){const r=[];for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++)for(let k=j+1;k<arr.length;k++)r.push([arr[i],arr[j],arr[k]]);return r;}
function bestPLO(hand,board){
  let best=null;
  for(const h2 of combos2(hand)){
    for(const b3 of combos3(board)){
      const e=ev5([...h2,...b3]);
      if(!best||cmpH(e,best)>0)best=e;
    }
  }
  return best;
}

function findNuts(board){
  const usedIds=new Set(board.map(c=>c.rank+c.suit));
  const remaining=[];
  for(const s of SUITS)for(const r of RANKS)if(!usedIds.has(r+s))remaining.push({rank:r,suit:s});
  let best=null;
  for(const h2 of combos2(remaining)){
    for(const b3 of combos3(board)){
      const e=ev5([...h2,...b3]);
      if(!best||cmpH(e,best)>0)best=e;
    }
  }
  return best;
}

// ── CARD ──
function Card({card,faceDown=false,size="md"}){
  const S={xs:{w:22,h:32,r:3,fi:7,si:5,ci:9,p:"1px"},sm:{w:38,h:54,r:4,fi:11,si:9,ci:16,p:"2px"},md:{w:48,h:68,r:5,fi:14,si:11,ci:20,p:"3px 4px"},lg:{w:60,h:86,r:6,fi:17,si:13,ci:24,p:"4px 5px"}};
  const z=S[size]||S.md;
  if(faceDown)return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"linear-gradient(150deg,#8B1A1A,#5C0E0E 60%,#3D0808)",border:"1.5px solid rgba(201,168,76,0.45)",boxShadow:"0 3px 10px rgba(0,0,0,0.4)",flexShrink:0,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:3,borderRadius:z.r-1,border:"1px solid rgba(201,168,76,0.15)",background:"repeating-conic-gradient(rgba(201,168,76,0.04) 0% 25%,transparent 0% 50%) 0 0/5px 5px"}}/></div>);
  const col=SC[card.suit];
  return(<div style={{width:z.w,height:z.h,borderRadius:z.r,background:"#fff",color:col,border:"1.5px solid #bbb",padding:z.p,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,0.15)",fontFamily:"'Playfair Display',serif",flexShrink:0,position:"relative"}}><div style={{lineHeight:1,display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div><div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:z.ci,lineHeight:1}}>{card.suit}</div><div style={{lineHeight:1,alignSelf:"flex-end",transform:"rotate(180deg)",display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}><div style={{fontSize:z.fi,fontWeight:800}}>{card.rank}</div><div style={{fontSize:z.si,marginTop:-1}}>{card.suit}</div></div></div>);
}

// ── MODE 2 ENGINE ──
const STREET_NAMES=["PRE-FLOP","FLOP","TURN","RIVER"];

function generateFullHand(numPlayers,sb,bb){
  const deck=mkDeck();let deckIdx=0;
  const btnIdx=Math.floor(Math.random()*numPlayers);
  const positions=numPlayers===9?POSITIONS_9:POSITIONS_8;
  const players=[];
  for(let i=0;i<numPlayers;i++){
    const posIdx=(i-btnIdx+numPlayers)%numPlayers;
    const stack=Math.floor((40+Math.random()*160)*bb);
    const roundedStack=roundBet(stack,sb);
    players.push({pos:positions[posIdx],posIdx,seatIdx:i,cards:[deck[deckIdx++],deck[deckIdx++],deck[deckIdx++],deck[deckIdx++]],isBtn:i===btnIdx,startStack:Math.max(roundedStack,bb*10),stack:Math.max(roundedStack,bb*10),totalBetStreet:0,totalBetHand:0,folded:false,allIn:false});
  }
  const sbIdx=(btnIdx+1)%numPlayers;
  const bbIdx=(btnIdx+2)%numPlayers;
  const board=[deck[deckIdx++],deck[deckIdx++],deck[deckIdx++],deck[deckIdx++],deck[deckIdx++]];
  return{players,btnIdx,sbIdx,bbIdx,board,sb,bb,positions};
}

function calcPotRaiseTotal(deadPot,allBetsOnStreet,currentBet,myCurrentBet){
  const toCall=currentBet-myCurrentBet;
  const potAfterCall=deadPot+allBetsOnStreet+toCall;
  return currentBet+potAfterCall;
}
function calcAmericanRaise(currentBet,lastRaiseIncrement){return currentBet+lastRaiseIncrement;}
function calcMinRaise(currentBet,lastRaiseSize,bb){const raiseIncrement=Math.max(lastRaiseSize,bb);return currentBet+raiseIncrement;}

function calculateSidePots(players){
  var eligible=players.filter(function(p){return !p.folded;});
  if(eligible.length===0)return[];
  var allInPlayers=eligible.filter(function(p){return p.allIn;});
  var allInAmounts=[];var seen={};
  for(var k=0;k<allInPlayers.length;k++){var amt=allInPlayers[k].totalBetHand;if(!seen[amt]){allInAmounts.push(amt);seen[amt]=true;}}
  allInAmounts.sort(function(a,b){return a-b;});
  if(allInAmounts.length===0){var total=0;for(var i=0;i<players.length;i++)total+=players[i].totalBetHand;return[{amount:total,eligible:eligible.map(function(p){return p.pos;}),label:"Pot principal"}];}
  var activeNotAllIn=eligible.filter(function(p){return !p.allIn;});
  if(activeNotAllIn.length===0&&allInAmounts.length>1){allInAmounts.pop();}
  var pots=[];var prevLevel=0;
  for(var li=0;li<allInAmounts.length;li++){
    var level=allInAmounts[li];var potAmt=0;var elig=[];
    for(var pi=0;pi<players.length;pi++){var p=players[pi];var contrib=Math.min(p.totalBetHand,level)-Math.min(p.totalBetHand,prevLevel);if(contrib>0)potAmt+=contrib;if(!p.folded&&p.totalBetHand>=level)elig.push(p.pos);}
    if(potAmt>0){pots.push({amount:potAmt,eligible:elig,label:pots.length===0?"Pot principal":"Side pot "+pots.length});}
    prevLevel=level;
  }
  var maxLevel=allInAmounts[allInAmounts.length-1];var remainAmt=0;var remainElig=[];
  for(var ri=0;ri<players.length;ri++){var rp=players[ri];if(rp.totalBetHand>maxLevel){remainAmt+=rp.totalBetHand-maxLevel;if(!rp.folded)remainElig.push(rp.pos);}}
  if(remainAmt>0){pots.push({amount:remainAmt,eligible:remainElig,label:pots.length===0?"Pot principal":"Side pot "+pots.length});}
  if(pots.length>1&&pots[pots.length-1].eligible.length<=1){pots.pop();}
  return pots;
}

// ── MAIN ──
export default function PLOSimulator(){
  const [screen,setScreen]=useState("menu");
  const [mode,setMode]=useState(1);
  const [numPlayers,setNumPlayers]=useState(8);
  const [stats,setStats]=useState({ok:0,total:0,rounds:0});
  // Mode 1 state
  const [m1Board,setM1Board]=useState([]);
  const [m1Players,setM1Players]=useState([]);
  const [m1BtnIdx,setM1BtnIdx]=useState(0);
  const [m1Nuts,setM1Nuts]=useState(null);
  const [m1Wrong,setM1Wrong]=useState(false);
  const [m1Phase,setM1Phase]=useState("idle");
  const [m1Comp,setM1Comp]=useState(false);
  const [m1CompRound,setM1CompRound]=useState(0);
  const [m1CompErrors,setM1CompErrors]=useState([]);
  const [m1CompTimes,setM1CompTimes]=useState([]);
  const [m1CompDone,setM1CompDone]=useState(false);
  const [m1RoundStart,setM1RoundStart]=useState(0);
  const inpRef=useRef(null);
  // Mode 2 state
  const [m3Table,setM3Table]=useState(null);
  const [m3Hand,setM3Hand]=useState(null);
  const [m3Street,setM3Street]=useState(0);
  const [m3DeadPot,setM3DeadPot]=useState(0);
  const [m3Question,setM3Question]=useState(null);
  const [m3ShowAnswer,setM3ShowAnswer]=useState(false);
  const [m3HandComplete,setM3HandComplete]=useState(false);
  const [m3HandCount,setM3HandCount]=useState(0);
  const [m3Stats,setM3Stats]=useState({potOk:0,potTotal:0,raiseOk:0,raiseTotal:0});
  const [m3Errors,setM3Errors]=useState([]);
  const [m3StreetBets,setM3StreetBets]=useState({});
  const [m3CurrentBet,setM3CurrentBet]=useState(0);
  const [m3LastRaiseSize,setM3LastRaiseSize]=useState(0);
  const [m3SidePots,setM3SidePots]=useState(null);
  const [m3Queue,setM3Queue]=useState([]);
  const [m3RaiseCount,setM3RaiseCount]=useState(0);
  const [m3Raise1,setM3Raise1]=useState("");
  const [m3Raise2,setM3Raise2]=useState("");
  const m3Raise1Ref=useRef("");
  const m3Raise2Ref=useRef("");
  const [m3RetryCount,setM3RetryCount]=useState(0);
  const [m3PotInputs,setM3PotInputs]=useState([]);
  const [m3PotWrongs,setM3PotWrongs]=useState([]);
  const m3Ref1=useRef(null);

  useEffect(()=>{
    const style=document.createElement('style');
    style.textContent='@keyframes m3pulse{0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}}';
    document.head.appendChild(style);
    return()=>document.head.removeChild(style);
  },[]);

  // ── MODE 1: Board Reading ──
  const HAND_CHOICES=["Carte Haute","Paire","Deux Paires","Brelan","Suite","Couleur","Full","Carre","Quinte Flush"];
  const MAIN_CHOICES=["Main 1","Main 2","Main 3"];

  const m1Deal=()=>{
    var d=mkDeck();var idx=0;
    var ps=[];
    for(var i=0;i<3;i++){ps.push({cards:[d[idx++],d[idx++],d[idx++],d[idx++]]});}
    var board=[d[idx++],d[idx++],d[idx++],d[idx++],d[idx++]];
    var nuts=findNuts(board);
    var bestIdx=0;var bestEval=null;
    for(var h=0;h<3;h++){var ev=bestPLO(ps[h].cards,board);if(!bestEval||cmpH(ev,bestEval)>0){bestEval=ev;bestIdx=h;}}
    setM1Board(board);setM1Players(ps);setM1BtnIdx(bestIdx);setM1Nuts(nuts);
    setM1Wrong(false);setM1Phase("nuts");setM1RoundStart(Date.now());
  };

  const m1Normalize=function(s){return(s||"").toLowerCase().replace(/é/g,"e").replace(/è/g,"e").replace(/carré/g,"carre");};

  const m1ClickAnswer=(choice)=>{
    var correct=false;
    if(m1Phase==="nuts"){
      var nutsName=m1Normalize((m1Nuts||{}).name);var ans=m1Normalize(choice);
      correct=(nutsName===ans);
      if(correct){setM1Wrong(false);setM1Phase("besthand");setStats(function(s){return{ok:s.ok+1,total:s.total+1,rounds:s.rounds};});return;}
    }else if(m1Phase==="besthand"){
      var choiceIdx=parseInt(choice.replace("Main ",""))-1;correct=(choiceIdx===m1BtnIdx);
      if(correct){setM1Wrong(false);setM1Phase("bestcombo");setStats(function(s){return{ok:s.ok+1,total:s.total+1,rounds:s.rounds};});return;}
    }else if(m1Phase==="bestcombo"){
      var bestHand=m1Players[m1BtnIdx];var bestEv=bestPLO(bestHand.cards,m1Board);
      var bestName=m1Normalize((bestEv||{}).name);var ans2=m1Normalize(choice);
      correct=(bestName===ans2);
      if(correct){
        var elapsed=Date.now()-m1RoundStart;
        setStats(function(s){return{ok:s.ok+1,total:s.total+1,rounds:s.rounds+1};});
        setM1Wrong(false);
        if(m1Comp){setM1CompTimes(function(t){return t.concat([elapsed]);});if(m1CompRound>=25){setM1CompDone(true);return;}setM1CompRound(function(r){return r+1;});}
        setTimeout(function(){m1Deal();},500);return;
      }
    }
    setM1Wrong(true);setStats(function(s){return{ok:s.ok,total:s.total+1,rounds:s.rounds};});
    if(m1Comp){setM1CompErrors(function(e){return e.concat([{round:m1CompRound,question:m1Phase}]);});}
  };

  // ── MODE 2: Full Hand Simulation ──
  function m3GenStreetActions(hand,deadPot,streetIdx,configR1,configR2){
    const{players,sbIdx,bbIdx,sb,bb}=hand;const n=players.length;const isPreflop=streetIdx===0;const actions=[];
    let order=[];
    if(isPreflop){for(let i=1;i<=n;i++){const idx=(bbIdx+i)%n;order.push(idx);}}
    else{for(let i=0;i<n;i++){const idx=(sbIdx+i)%n;order.push(idx);}}
    let currentBet=isPreflop?bb:0;let lastRaiseSize=isPreflop?bb:0;let allBets=isPreflop?sb+bb:0;
    const sBets={};players.forEach((p,i)=>{sBets[i]=0;});
    if(isPreflop){sBets[sbIdx]=sb;sBets[bbIdx]=bb;}
    let raiseCount=0;let acted=new Set();let passes=0;let keepGoing=true;
    var r1Amount=(isPreflop&&configR1>0)?configR1:0;
    var r2Amount=(isPreflop&&configR2>0)?configR2:0;
    var utgIdx=isPreflop?order[0]:-1;var utg1Idx=isPreflop&&order.length>1?order[1]:-1;
    while(keepGoing&&passes<30){
      passes++;let anyAction=false;
      for(const pidx of order){
        if(players[pidx].folded||players[pidx].allIn)continue;
        const myBet=sBets[pidx]||0;const toCall=currentBet-myBet;
        if(acted.has(pidx)&&toCall<=0)continue;
        const activePlayers=players.filter(p=>!p.folded&&!p.allIn).length;
        const r=Math.random();var action=null;
        var forcedRaise=0;
        if(pidx===utgIdx&&r1Amount>0&&!acted.has(pidx)){forcedRaise=r1Amount;}
        else if(pidx===utg1Idx&&r2Amount>0&&!acted.has(pidx)&&raiseCount<=1){forcedRaise=r2Amount;}
        if(forcedRaise>0){
          var maxAff=players[pidx].stack+myBet;
          if(forcedRaise>=maxAff){action={type:"ALL-IN",pidx,amount:maxAff};}
          else if(forcedRaise>currentBet){action={type:"RAISE",pidx,amount:forcedRaise};}
          else{if(toCall>=players[pidx].stack){action={type:"ALL-IN",pidx,amount:players[pidx].stack+myBet};}else{action={type:"CALL",pidx,amount:currentBet};}}
        }else if(toCall<=0){
          if(r<0.60){action={type:"CHECK",pidx};}
          else{
            var potR0=calcPotRaiseTotal(deadPot,allBets,currentBet,myBet);
            var maxAfford0=players[pidx].stack;
            if(maxAfford0<=0){action={type:"CHECK",pidx};}
            else if(maxAfford0<=bb){action={type:"ALL-IN",pidx,amount:maxAfford0+myBet};}
            else{
              var minBet=bb;var chosen=minBet+Math.floor(Math.random()*Math.max(1,Math.min(potR0,maxAfford0)-minBet));
              var rounded=roundBet(chosen,sb);var final2=Math.max(Math.min(rounded,maxAfford0),minBet);
              if(final2>=maxAfford0){action={type:"ALL-IN",pidx,amount:maxAfford0+myBet};}
              else if(r<0.80){action={type:"BET",pidx,amount:final2};}
              else{var potAmt0=Math.min(potR0,maxAfford0);if(potAmt0>=maxAfford0){action={type:"ALL-IN",pidx,amount:maxAfford0+myBet};}else{action={type:"POT",pidx,amount:potAmt0};}}
            }
          }
        }else{
          if(r<0.20&&activePlayers>2){action={type:"FOLD",pidx};}
          else if(r<0.80||raiseCount>=4){
            if(toCall>=players[pidx].stack){action={type:"ALL-IN",pidx,amount:players[pidx].stack+myBet};}
            else{action={type:"CALL",pidx,amount:currentBet};}
          }else{
            var minR=calcMinRaise(currentBet,lastRaiseSize,bb);var potR=calcPotRaiseTotal(deadPot,allBets,currentBet,myBet);
            var maxAfford=players[pidx].stack+myBet;
            if(maxAfford<=currentBet){action={type:"ALL-IN",pidx,amount:maxAfford};}
            else if(maxAfford<minR){action={type:"ALL-IN",pidx,amount:maxAfford};}
            else{
              var isPotRaise=Math.random()>0.50;
              if(isPotRaise){var amt=Math.min(potR,maxAfford);if(amt>=maxAfford){action={type:"ALL-IN",pidx,amount:maxAfford};}else{action={type:"POT",pidx,amount:amt};}}
              else{
                var raiseTo=minR+Math.floor(Math.random()*Math.max(1,potR-minR));raiseTo=Math.min(raiseTo,maxAfford);raiseTo=roundBet(raiseTo,sb);raiseTo=Math.max(raiseTo,minR);raiseTo=Math.min(raiseTo,maxAfford);
                if(raiseTo>=maxAfford){action={type:"ALL-IN",pidx,amount:maxAfford};}else{action={type:"RAISE",pidx,amount:raiseTo};}
              }
            }
          }
        }
        if(!action)continue;
        acted.add(pidx);anyAction=true;
        const prevBet=sBets[pidx]||0;let newCurrentBet=currentBet;let newLastRaiseSize=lastRaiseSize;let newRaiseCount=raiseCount;let isRaiseAction=false;
        if(action.type==="FOLD"){players[pidx].folded=true;}
        else if(action.type==="CHECK"){}
        else if(action.type==="CALL"){const add=action.amount-prevBet;players[pidx].stack-=add;players[pidx].totalBetHand+=add;sBets[pidx]=action.amount;allBets+=add;}
        else if(action.type==="BET"||action.type==="RAISE"||action.type==="POT"){const add=action.amount-prevBet;players[pidx].stack-=add;players[pidx].totalBetHand+=add;sBets[pidx]=action.amount;allBets+=add;newLastRaiseSize=action.amount-currentBet;newCurrentBet=action.amount;newRaiseCount=raiseCount+1;isRaiseAction=true;for(const oidx of order){if(oidx!==pidx&&!players[oidx].folded&&!players[oidx].allIn)acted.delete(oidx);}}
        else if(action.type==="ALL-IN"){const add=action.amount-prevBet;players[pidx].stack-=add;players[pidx].allIn=true;players[pidx].totalBetHand+=add;sBets[pidx]=action.amount;allBets+=add;if(action.amount>currentBet){const raiseInc=action.amount-currentBet;if(raiseInc>=lastRaiseSize){for(const oidx of order){if(oidx!==pidx&&!players[oidx].folded&&!players[oidx].allIn)acted.delete(oidx);}}newLastRaiseSize=raiseInc;newCurrentBet=action.amount;newRaiseCount=raiseCount+1;isRaiseAction=true;}}
        var potAfter=deadPot+allBets;
        var askQuestion=false;var questionType=null;var correctPot=null;var correctRaise=null;
        var wasForced=(forcedRaise>0);
        if(!wasForced&&(action.type==="BET"||action.type==="RAISE"||action.type==="POT"||(action.type==="ALL-IN"&&action.amount>currentBet))){
          askQuestion=true;questionType="raise";
          var addedThisAction2=(sBets[pidx]||0)-prevBet;var totalBetsBefore2=allBets-addedThisAction2;
          var effectiveDeadPot=isPreflop?0:deadPot;var toCallCalc=currentBet-prevBet;var potAfterCall=effectiveDeadPot+totalBetsBefore2+toCallCalc;
          correctPot=currentBet+potAfterCall;
          if(raiseCount>=1){correctRaise=currentBet+lastRaiseSize;}
        }
        actions.push({...action,prevBet,potAfter,isRaiseAction,askQuestion,questionType,correctPot,correctRaise,streetBetsSnapshot:{...sBets},currentBet:newCurrentBet,lastRaiseSize:newLastRaiseSize,raiseCount:newRaiseCount});
        currentBet=newCurrentBet;lastRaiseSize=newLastRaiseSize;raiseCount=newRaiseCount;
      }
      const stillToAct=order.filter(pidx=>!players[pidx].folded&&!players[pidx].allIn&&(!acted.has(pidx)||(sBets[pidx]||0)<currentBet));
      if(stillToAct.length===0||!anyAction)keepGoing=false;
    }
    return{actions,finalPot:deadPot+allBets};
  }

  function m3StartNewHand(){
    if(!m3Table)return;
    const hand=generateFullHand(numPlayers,m3Table.sb,m3Table.bb);
    const{players,sbIdx,bbIdx,sb,bb}=hand;
    players[sbIdx].stack-=sb;players[sbIdx].totalBetHand=sb;
    players[bbIdx].stack-=bb;players[bbIdx].totalBetHand=bb;
    const simPlayers=players.map(p=>({...p}));
    const simHand={...hand,players:simPlayers};
    const r1=parseInt(m3Raise1Ref.current)||0;const r2=parseInt(m3Raise2Ref.current)||0;
    const preflop=m3GenStreetActions(simHand,0,0,r1,r2);
    setM3Hand(hand);setM3Street(0);setM3DeadPot(0);setM3Question(null);setM3ShowAnswer(false);setM3HandComplete(false);setM3RaiseCount(0);setM3SidePots(null);
    const initBets={};players.forEach((p,i)=>{initBets[i]=0;});initBets[sbIdx]=sb;initBets[bbIdx]=bb;
    setM3StreetBets(initBets);setM3CurrentBet(bb);setM3LastRaiseSize(bb);
    setM3Queue(preflop.actions.map(a=>({...a,streetIdx:0,deadPot:0})));
    setTimeout(()=>m3ProcessQueue(hand,preflop.actions.map(a=>({...a,streetIdx:0,deadPot:0})),0,0),1000);
  }

  function m3ProcessQueue(hand,queue,qIdx,deadPot){
    if(!hand||qIdx>=queue.length){
      var lastAction=queue.length>0?queue[queue.length-1]:null;
      var finalBets=lastAction?lastAction.streetBetsSnapshot:{};
      var totalBets=Object.values(finalBets).reduce(function(s,v){return s+v;},0);
      var newDeadPot=deadPot+totalBets;
      var streetIdx=(queue[0]?queue[0].streetIdx:0);
      var hadBets=queue.some(function(a){return a.type==="BET"||a.type==="RAISE"||a.type==="POT"||a.type==="CALL"||(a.type==="ALL-IN"&&a.amount>0);});
      if(hadBets){
        var expectedPots=calculateSidePots(hand.players);
        if(expectedPots.length>0){
          var prevPots=m3SidePots||[];var changedPots=[];
          for(var pi=0;pi<expectedPots.length;pi++){var prev=prevPots[pi];var curr=expectedPots[pi];if(!(prev&&prev.amount===curr.amount&&prev.label===curr.label)){changedPots.push(pi);}}
          if(changedPots.length>0){
            setM3Question({type:"sidepots",expectedPots,changedIndices:changedPots,newDeadPot,streetIdx});
            var inputs=expectedPots.map(function(ep,idx){return changedPots.indexOf(idx)===-1?String(ep.amount):"";});
            setM3PotInputs(inputs);setM3PotWrongs(expectedPots.map(function(){return false;}));setM3ShowAnswer(false);setM3RetryCount(0);
            setTimeout(function(){if(m3Ref1.current)m3Ref1.current.focus();},200);return;
          }
          setM3SidePots(expectedPots);
        }
      }
      m3AdvanceStreet(hand,newDeadPot,streetIdx);return;
    }
    var action=queue[qIdx];
    if(action.askQuestion){
      setM3Question({type:"raise",action,playerPos:hand.players[action.pidx].pos,correctPot:action.correctPot,correctRaise:action.correctRaise,questionType:action.questionType,qIdx,queue,deadPot});
      setM3PotInputs(action.correctRaise!=null?["",""]:[""]); setM3PotWrongs(action.correctRaise!=null?[false,false]:[false]);setM3ShowAnswer(false);setM3RetryCount(0);
      setTimeout(function(){if(m3Ref1.current)m3Ref1.current.focus();},200);return;
    }
    m3ApplySnapshot(hand,action);
    var nonFolded=hand.players.filter(function(p){return !p.folded;}).length;
    if(nonFolded<=1){var fBets=action.streetBetsSnapshot;var tBets=Object.values(fBets).reduce(function(s,v){return s+v;},0);setM3DeadPot(deadPot+tBets);setM3HandComplete(true);return;}
    setTimeout(function(){m3ProcessQueue(hand,queue,qIdx+1,deadPot);},1000);
  }

  function m3ApplySnapshot(hand,action){
    var p=hand.players[action.pidx];
    if(action.type==="FOLD")p.folded=true;
    if(action.type==="ALL-IN")p.allIn=true;
    var prevBet=action.prevBet||0;var newBet=action.streetBetsSnapshot[action.pidx]||0;var added=newBet-prevBet;
    if(added>0){p.stack-=added;p.totalBetHand+=added;}
    setM3StreetBets({...action.streetBetsSnapshot});setM3CurrentBet(action.currentBet);setM3LastRaiseSize(action.lastRaiseSize);setM3RaiseCount(action.raiseCount);setM3Hand({...hand});
  }

  function m3ResumeAfterQuestion(){
    if(!m3Question||!m3Hand)return;
    var hand=m3Hand;
    if(m3Question.type==="sidepots"){
      setM3SidePots(m3Question.expectedPots);setM3Question(null);setM3ShowAnswer(false);setM3RetryCount(0);
      m3AdvanceStreet(hand,m3Question.newDeadPot,m3Question.streetIdx);
    }else if(m3Question.type==="raise"){
      var action=m3Question.action;var qIdx=m3Question.qIdx;var queue=m3Question.queue;var deadPot=m3Question.deadPot;
      m3ApplySnapshot(hand,action);setM3Question(null);setM3ShowAnswer(false);setM3RetryCount(0);
      var nonFolded=hand.players.filter(function(p){return !p.folded;}).length;
      if(nonFolded<=1){var fBets=action.streetBetsSnapshot;var tBets=Object.values(fBets).reduce(function(s,v){return s+v;},0);setM3DeadPot(deadPot+tBets);setM3HandComplete(true);return;}
      setTimeout(function(){m3ProcessQueue(hand,queue,qIdx+1,deadPot);},1000);
    }
  }

  function m3AdvanceStreet(hand,newDeadPot,prevStreetIdx){
    if(!hand)return;
    var nonFolded=hand.players.filter(function(p){return !p.folded;}).length;
    var activeNotAllIn=hand.players.filter(function(p){return !p.folded&&!p.allIn;}).length;
    if(nonFolded<=1||prevStreetIdx>=3){setM3DeadPot(newDeadPot);setM3HandComplete(true);var hasAllIn=hand.players.some(function(p){return p.allIn&&!p.folded;});if(hasAllIn)setM3SidePots(calculateSidePots(hand.players));return;}
    var nextStreet=prevStreetIdx+1;
    setM3Street(nextStreet);setM3DeadPot(newDeadPot);setM3RaiseCount(0);
    var newBets={};hand.players.forEach(function(p,i){newBets[i]=0;});setM3StreetBets(newBets);setM3CurrentBet(0);setM3LastRaiseSize(0);setM3Hand({...hand});
    if(activeNotAllIn<=1){if(nextStreet<3){setTimeout(function(){m3AdvanceStreet(hand,newDeadPot,nextStreet);},1200);}else{setM3HandComplete(true);}return;}
    var simPlayers=hand.players.map(function(p){return Object.assign({},p);});
    var simHand=Object.assign({},hand,{players:simPlayers});
    var streetResult=m3GenStreetActions(simHand,newDeadPot,nextStreet,0,0);
    if(streetResult.actions.length===0){m3AdvanceStreet(hand,newDeadPot,nextStreet);return;}
    var newQueue=streetResult.actions.map(function(a){return Object.assign({},a,{streetIdx:nextStreet,deadPot:newDeadPot});});
    setM3Queue(newQueue);
    setTimeout(function(){m3ProcessQueue(hand,newQueue,0,newDeadPot);},1000);
  }

  function m3SubmitAnswer(){
    if(!m3Question)return;
    if(m3Question.type==="sidepots"){
      var expected=m3Question.expectedPots;var allCorrect=true;var wrongs=[];
      for(var i=0;i<expected.length;i++){var uv=parseInt(m3PotInputs[i]);var ok=!isNaN(uv)&&uv===expected[i].amount;wrongs.push(!ok);if(!ok)allCorrect=false;}
      if(allCorrect){setM3Stats(function(s){return{potOk:s.potOk+expected.length,potTotal:s.potTotal+expected.length,raiseOk:s.raiseOk,raiseTotal:s.raiseTotal};});setM3RetryCount(0);m3ResumeAfterQuestion();}
      else if(m3RetryCount===0){setM3RetryCount(1);setM3PotWrongs(wrongs);setM3PotInputs(expected.map(function(){return"";}));setTimeout(function(){if(m3Ref1.current)m3Ref1.current.focus();},150);}
      else{setM3ShowAnswer(true);setM3PotWrongs(wrongs);var okC=wrongs.filter(function(w){return !w;}).length;setM3Stats(function(s){return{potOk:s.potOk+okC,potTotal:s.potTotal+expected.length,raiseOk:s.raiseOk,raiseTotal:s.raiseTotal};});setM3Errors(function(prev){return prev.concat([{hand:m3HandCount+1,type:"sidepots"}]);});}
    }else if(m3Question.type==="raise"){
      var cPot=m3Question.correctPot;var cRaise=m3Question.correctRaise;
      var potOk=!isNaN(parseInt(m3PotInputs[0]))&&parseInt(m3PotInputs[0])===cPot;
      var raiseOk=true;if(cRaise!=null){raiseOk=!isNaN(parseInt(m3PotInputs[1]))&&parseInt(m3PotInputs[1])===cRaise;}
      var rW=[!potOk];if(cRaise!=null)rW.push(!raiseOk);
      if(potOk&&raiseOk){setM3Stats(function(s){return{potOk:s.potOk+1,potTotal:s.potTotal+1,raiseOk:s.raiseOk+(cRaise!=null?1:0),raiseTotal:s.raiseTotal+(cRaise!=null?1:0)};});setM3RetryCount(0);m3ResumeAfterQuestion();}
      else if(m3RetryCount===0){setM3RetryCount(1);setM3PotWrongs(rW);setM3PotInputs(cRaise!=null?["",""]:[""]); setTimeout(function(){if(m3Ref1.current)m3Ref1.current.focus();},150);}
      else{setM3ShowAnswer(true);setM3PotWrongs(rW);setM3Stats(function(s){return{potOk:s.potOk+(potOk?1:0),potTotal:s.potTotal+1,raiseOk:s.raiseOk+(raiseOk&&cRaise!=null?1:0),raiseTotal:s.raiseTotal+(cRaise!=null?1:0)};});setM3Errors(function(prev){return prev.concat([{hand:m3HandCount+1,type:"raise"}]);});}
    }
  }

  function m3ContinueAfterError(){setM3ShowAnswer(false);setM3RetryCount(0);m3ResumeAfterQuestion();}

  const actionColor=(t)=>{
    if(t==="FOLD")return{bg:"#555",c:"#ccc"};if(t==="CHECK")return{bg:"#2E7D32",c:"#fff"};if(t==="CALL")return{bg:"#1565C0",c:"#fff"};
    if(t==="BET")return{bg:"#E65100",c:"#fff"};if(t==="RAISE")return{bg:"#FF6F00",c:"#fff"};if(t==="POT")return{bg:"#C62828",c:"#fff"};
    if(t==="ALL-IN")return{bg:"#7B1FA2",c:"#fff"};if(t==="SB"||t==="BB")return{bg:"#1565C0",c:"#fff"};
    return{bg:"#444",c:"#fff"};
  };

  // ── MENU ──
  if(screen==="menu")return(
    <div className="cp-sim-shell cp-sim-page">
      <div style={{position:"fixed",inset:0,opacity:0.02,pointerEvents:"none",zIndex:9999,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>
      <SimulatorHeader title="Pot Limit Omaha" badge="PLO" />
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"82vh",gap:20,padding:"0 16px"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C9A84C",marginBottom:6}}>Dealer School</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.4rem,3.5vw,2rem)",fontWeight:900,lineHeight:1.15,margin:0}}>Pot Limit <span style={{color:"#C9A84C",fontStyle:"italic"}}>Omaha</span></h1>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[8,9].map(n=>(<button key={n} onClick={()=>setNumPlayers(n)} style={{padding:"8px 20px",background:numPlayers===n?"rgba(201,168,76,0.1)":"#141414",border:numPlayers===n?"2px solid #C9A84C":"1px solid rgba(255,255,255,0.05)",borderRadius:4,color:numPlayers===n?"#C9A84C":"#BFB9AD",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{n} joueurs</button>))}
        </div>
        <div>
          <div style={{textAlign:"center",fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#BFB9AD",marginBottom:5}}>Mode</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
            {[{m:1,l:"Lecture de board"},{m:2,l:"Simulation complète"}].map(({m,l})=>(
              <div key={m} onClick={()=>setMode(m)} style={{padding:"10px 20px",background:mode===m?"rgba(201,168,76,0.1)":"#141414",border:mode===m?"2px solid #C9A84C":"1px solid rgba(255,255,255,0.05)",borderRadius:4,cursor:"pointer",textAlign:"center"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:900,color:mode===m?"#C9A84C":"#BFB9AD"}}>{m}</div>
                <div style={{fontSize:8,color:"#BFB9AD",marginTop:1}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {mode===2&&(
          <div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.08)",borderRadius:6,padding:16,maxWidth:400,width:"100%"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Configuration Table</div>
            <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
              {TABLES.map(t=>(<button key={t.bb} onClick={()=>setM3Table(t)} style={{padding:"6px 14px",background:(m3Table||{}).bb===t.bb?"rgba(201,168,76,0.1)":"#0a0a0a",border:(m3Table||{}).bb===t.bb?"1.5px solid #C9A84C":"1px solid rgba(255,255,255,0.06)",borderRadius:3,color:(m3Table||{}).bb===t.bb?"#C9A84C":"#BFB9AD",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t.sb}/{t.bb}</button>))}
            </div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <div><div style={{fontSize:8,color:"#888",marginBottom:2}}>1re relance</div><input value={m3Raise1} onChange={function(e){setM3Raise1(e.target.value);m3Raise1Ref.current=e.target.value;}} placeholder={m3Table?String(m3Table.bb*3):""} style={{width:80,padding:"5px 8px",background:"#0a0a0a",border:"1px solid rgba(201,168,76,0.15)",borderRadius:3,color:"#F5F0E8",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/></div>
              <div><div style={{fontSize:8,color:"#888",marginBottom:2}}>2e relance</div><input value={m3Raise2} onChange={function(e){setM3Raise2(e.target.value);m3Raise2Ref.current=e.target.value;}} placeholder="auto" style={{width:80,padding:"5px 8px",background:"#0a0a0a",border:"1px solid rgba(201,168,76,0.15)",borderRadius:3,color:"#F5F0E8",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/></div>
            </div>
            <div style={{fontSize:8,color:"#666",lineHeight:1.4,marginTop:8}}>Laisse vide pour des montants aléatoires.</div>
          </div>
        )}
        <button onClick={()=>{setScreen("game");if(mode===1){setTimeout(()=>m1Deal(),100);}else if(mode===2){setM3HandCount(0);setM3Stats({potOk:0,potTotal:0,raiseOk:0,raiseTotal:0});setM3Errors([]);setTimeout(()=>m3StartNewHand(),100);}}} disabled={mode===2&&!m3Table} style={{padding:"12px 36px",background:(mode===2&&!m3Table)?"#333":"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:(mode===2&&!m3Table)?"default":"pointer",fontFamily:"'DM Sans',sans-serif"}}>Commencer</button>
      </div>
    </div>
  );

  const Hdr=({label})=>(<SimulatorHeader title="PLO" badge={label} stats={`R${stats.rounds+1}${stats.total>0?` · ${Math.round(stats.ok/stats.total*100)}%`:""}`} onBackToMenu={()=>{setScreen("menu");}} />);

  // ── MODE 1: BOARD READING ──
  if(mode===1&&screen==="game")return(
    <div className="cp-sim-shell cp-sim-page">
      <Hdr label="PLO · Lecture de board"/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"12px 12px"}}>
        {!m1CompDone?(
          <>
            {m1Comp&&<div style={{fontSize:10,fontWeight:700,color:"#C9A84C",textAlign:"center",marginBottom:6}}>Compétition · {m1CompRound}/25</div>}
            <div style={{background:"radial-gradient(ellipse 120% 80% at 50% 50%,#1A6B4F,#15553A 40%,#0F3D1F 80%,#0B3320)",borderRadius:16,padding:"16px",border:"4px solid rgba(201,168,76,0.18)",boxShadow:"inset 0 0 80px rgba(0,0,0,0.2),0 12px 40px rgba(0,0,0,0.4)",position:"relative",minHeight:280}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:16}}>
                {m1Players.map(function(p,i){return(
                  <div key={i} style={{background:"rgba(0,0,0,0.2)",borderRadius:12,padding:"8px 10px",border:"1.5px solid rgba(201,168,76,0.1)",textAlign:"center"}}>
                    <div style={{fontSize:8,fontWeight:700,color:"rgba(201,168,76,0.5)",letterSpacing:"0.08em",marginBottom:4}}>Main {i+1}</div>
                    <div style={{display:"flex",gap:2,justifyContent:"center"}}>
                      {p.cards.map(function(c){return <Card key={c.id} card={c} size="sm"/>;  })}
                    </div>
                  </div>
                );})}
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(201,168,76,0.35)",marginBottom:4}}>Board</div>
                <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  {m1Board.map(function(c){return <Card key={c.id} card={c} size="lg"/>;  })}
                </div>
              </div>
            </div>
            <div style={{marginTop:10,padding:14,background:"#141414",border:"1px solid rgba(201,168,76,0.1)",borderRadius:6}}>
              <div style={{fontSize:12,fontWeight:700,color:"#C9A84C",letterSpacing:"0.05em",marginBottom:10}}>
                {m1Phase==="nuts"&&"Quelle est la meilleure combinaison probable avec ce board ?"}
                {m1Phase==="besthand"&&"Quelle est la main la plus forte ?"}
                {m1Phase==="bestcombo"&&"Avec quelle combinaison ?"}
              </div>
              {m1Wrong&&<div style={{fontSize:10,color:"#C62828",fontWeight:700,marginBottom:6}}>Mauvaise réponse, réessaye</div>}
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {m1Phase==="besthand"?(
                  MAIN_CHOICES.map(function(ch){return(
                    <button key={ch} onClick={function(){m1ClickAnswer(ch);}} style={{padding:"10px 20px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:4,color:"#F5F0E8",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}} onMouseEnter={function(e){e.target.style.background="rgba(201,168,76,0.2)";e.target.style.borderColor="#C9A84C";}} onMouseLeave={function(e){e.target.style.background="rgba(201,168,76,0.06)";e.target.style.borderColor="rgba(201,168,76,0.15)";}}>  {ch}</button>
                  );})
                ):(
                  HAND_CHOICES.map(function(ch){return(
                    <button key={ch} onClick={function(){m1ClickAnswer(ch);}} style={{padding:"8px 14px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:4,color:"#F5F0E8",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}} onMouseEnter={function(e){e.target.style.background="rgba(201,168,76,0.2)";e.target.style.borderColor="#C9A84C";}} onMouseLeave={function(e){e.target.style.background="rgba(201,168,76,0.06)";e.target.style.borderColor="rgba(201,168,76,0.15)";}}>  {ch}</button>
                  );})
                )}
              </div>
            </div>
            {!m1Comp&&(
              <div style={{textAlign:"center",marginTop:10}}>
                <button onClick={function(){setM1Comp(true);setM1CompRound(1);setM1CompErrors([]);setM1CompTimes([]);setM1CompDone(false);m1Deal();}} style={{padding:"8px 20px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:3,color:"#C9A84C",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Mode Compétition · 25 coups</button>
              </div>
            )}
          </>
        ):(
          <div style={{maxWidth:500,margin:"40px auto",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:900,fontFamily:"'Playfair Display',serif",color:"#C9A84C",marginBottom:12}}>Récapitulatif</div>
            <div style={{fontSize:13,color:"#BFB9AD",marginBottom:6}}>{25-m1CompErrors.length}/25 corrects</div>
            <div style={{fontSize:13,color:"#BFB9AD",marginBottom:16}}>Temps moyen : {m1CompTimes.length>0?(Math.round(m1CompTimes.reduce(function(a,b){return a+b;},0)/m1CompTimes.length/1000*10)/10)+"s":"—"}</div>
            {m1CompErrors.length>0&&(<div style={{background:"#141414",border:"1px solid rgba(201,168,76,0.08)",borderRadius:6,padding:12,textAlign:"left",marginBottom:16}}><div style={{fontSize:9,fontWeight:700,color:"#C62828",marginBottom:6}}>Erreurs :</div>{m1CompErrors.map(function(e,i){return(<div key={i} style={{fontSize:10,color:"#BFB9AD",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>Coup {e.round} · {e.question==="nuts"?"Nuts":"Main"}</div>);})}</div>)}
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={function(){setM1Comp(true);setM1CompRound(1);setM1CompErrors([]);setM1CompTimes([]);setM1CompDone(false);m1Deal();}} style={{padding:"9px 24px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:3,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Recommencer</button>
              <button onClick={function(){setM1Comp(false);setM1CompDone(false);m1Deal();}} style={{padding:"9px 24px",background:"transparent",color:"#BFB9AD",border:"1px solid rgba(255,255,255,0.08)",borderRadius:3,fontSize:9,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Mode libre</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── MODE 2: SIMULATION ──
  if(mode===2&&screen==="game"){
    const hand=m3Hand;if(!hand)return null;
    const streetLabel=STREET_NAMES[m3Street]||"PRE-FLOP";
    const boardCards=m3Street===0?[]:m3Street===1?hand.board.slice(0,3):m3Street===2?hand.board.slice(0,4):hand.board.slice(0,5);
    const n=hand.players.length;
    const gapCenter=90,gapHalf=30,arcStart=gapCenter+gapHalf,arcTotal=360-gapHalf*2,stepAng=arcTotal/n;
    const betsThisStreet=Object.values(m3StreetBets).reduce((s,v)=>s+v,0);
    const currentTotalPot=m3DeadPot+betsThisStreet;
    const actingIdx=(m3Question&&m3Question.action)?m3Question.action.pidx:-1;
    const playerLastAction={};
    if(m3Queue){var currentQIdx=m3Queue.length;if(m3Question&&m3Question.qIdx!=null)currentQIdx=m3Question.qIdx;for(var i=0;i<currentQIdx;i++){var a=m3Queue[i];if(a)playerLastAction[a.pidx]=a.type;}}

    return(
      <div className="cp-sim-shell cp-sim-page">
        <Hdr label={`PLO · Simulation · ${(m3Table||{}).sb}/${(m3Table||{}).bb}`}/>
        <div style={{maxWidth:750,margin:"0 auto",padding:"8px 8px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 12px",background:"rgba(0,0,0,0.3)",borderRadius:6,marginBottom:6,fontSize:10}}>
            <span style={{color:"#C9A84C",fontWeight:700}}>Main #{m3HandCount+1} · {streetLabel}</span>
            <span style={{color:"#BFB9AD"}}>Pot: {m3Stats.potOk}/{m3Stats.potTotal} · Raise: {m3Stats.raiseOk}/{m3Stats.raiseTotal}{(m3Stats.potTotal+m3Stats.raiseTotal)>0&&` · ${Math.round((m3Stats.potOk+m3Stats.raiseOk)/Math.max(1,m3Stats.potTotal+m3Stats.raiseTotal)*100)}%`}</span>
          </div>
          <div style={{position:"relative",width:"100%",paddingBottom:"58%",marginBottom:6}}>
            <div style={{position:"absolute",inset:"3%",borderRadius:"45%/42%",border:"4px solid rgba(20,60,35,0.7)",background:"rgba(10,40,25,0.4)"}}/>
            <div style={{position:"absolute",inset:"7%",borderRadius:"45%/42%",background:"radial-gradient(ellipse 100% 100% at 50% 50%,#1B7B52,#16694A 40%,#105838 70%,#0C4A2E)",border:"6px solid rgba(30,70,45,0.8)",boxShadow:"inset 0 0 60px rgba(0,0,0,0.15),0 0 0 3px #0a3018"}}/>
            <div style={{position:"absolute",top:"45%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",zIndex:4}}>
              {boardCards.length>0&&(<div style={{display:"flex",gap:3,justifyContent:"center"}}>{boardCards.map(function(c){return <Card key={c.id} card={c} size="sm"/>;})}</div>)}
            </div>
            {m3SidePots&&m3SidePots.length>0&&m3Street>=1&&(
              m3SidePots.map(function(sp,j){
                var colors=["#C9A84C","#4FC3F7","#81C784","#FFB74D","#CE93D8"];var col=colors[j%colors.length];
                var rightPct=(16+j*10)+"%";
                return(<div key={j} style={{position:"absolute",right:rightPct,top:"55%",transform:"translateY(-50%)",zIndex:5,background:"rgba(0,0,0,0.6)",borderRadius:5,padding:"3px 8px",border:"1.5px solid "+col,textAlign:"center",minWidth:40}}><div style={{fontSize:11,fontWeight:900,color:col}}>{sp.amount}</div><div style={{fontSize:6,color:"#aaa"}}>{sp.label}</div></div>);
              })
            )}
            {m3Street>=1&&(!m3SidePots||m3SidePots.length===0)&&currentTotalPot>0&&(
              <div style={{position:"absolute",right:"16%",top:"55%",transform:"translateY(-50%)",zIndex:5,background:"rgba(0,0,0,0.6)",borderRadius:5,padding:"3px 10px",border:"1.5px solid #C9A84C",textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:900,color:"#C9A84C"}}>{currentTotalPot}</div>
                <div style={{fontSize:6,color:"#aaa"}}>Pot</div>
              </div>
            )}
            <div style={{position:"absolute",left:"50%",bottom:"0%",transform:"translateX(-50%)",zIndex:5,textAlign:"center"}}>
              <div style={{background:"#1a3a28",borderRadius:8,padding:"3px 16px",border:"1.5px solid rgba(201,168,76,0.25)",boxShadow:"0 2px 8px rgba(0,0,0,0.3)"}}><span style={{fontSize:9,fontWeight:700,color:"#C9A84C",letterSpacing:"0.1em"}}>DEALER</span></div>
            </div>
            {hand.players.map((p,i)=>{
              const ang=(arcStart+stepAng*(i+0.5))*Math.PI/180;const px=50+46*Math.cos(ang);const py=50+43*Math.sin(ang);
              const isActing=i===actingIdx;const lastAct=playerLastAction[i];
              const displayAct=(lastAct&&p.allIn&&lastAct!=="FOLD")?"ALL-IN":lastAct;
              const ac=displayAct?actionColor(displayAct):null;const betAmt=m3StreetBets[i]||0;
              return(
                <div key={i} style={{position:"absolute",left:`${px}%`,top:`${py}%`,transform:"translate(-50%,-50%)",textAlign:"center",zIndex:3}}>
                  {displayAct&&(<div style={{marginBottom:2}}><span style={{fontSize:7,fontWeight:700,color:ac.c,background:ac.bg,padding:"1px 6px",borderRadius:3}}>{displayAct}</span></div>)}
                  {isActing&&!p.folded&&(<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:48,height:48,borderRadius:"50%",border:"2px solid #FFC107",animation:"m3pulse 1.2s ease-in-out infinite",zIndex:-1}}/>)}
                  <div style={{width:40,height:40,borderRadius:"50%",background:p.folded?"#333":p.allIn?"#C62828":isActing?"#FFC107":p.isBtn?"#FFC107":"#4a5568",border:isActing?"3px solid #FFC107":p.isBtn?"2px solid #FFC107":p.allIn?"2px solid #F44336":"2px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",position:"relative",boxShadow:isActing?"0 0 16px rgba(255,193,7,0.5)":p.allIn?"0 0 12px rgba(244,67,54,0.5)":"none",transition:"all 0.3s ease",opacity:p.folded?0.5:1}}>
                    <span style={{fontSize:8,fontWeight:800,color:(isActing||p.isBtn)&&!p.folded?"#0A0A0A":"#fff",lineHeight:1}}>{p.pos}</span>
                    {p.isBtn&&(<span style={{position:"absolute",bottom:-2,right:-2,fontSize:7,fontWeight:900,color:"#0A0A0A",background:"#FFC107",borderRadius:"50%",width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",border:"1.5px solid #0A0A0A",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}>D</span>)}
                  </div>
                  {!p.folded&&betAmt>0&&(<div style={{marginTop:2,fontSize:11,fontWeight:800,color:"#fff"}}>{betAmt}<span style={{fontSize:8,color:"#aaa"}}> €</span></div>)}
                  {!p.folded&&betAmt<=0&&(<div style={{marginTop:2,fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.4)"}}>{p.allIn?"all-in":p.stack}</div>)}
                  {p.folded&&betAmt>0&&(<div style={{marginTop:2,fontSize:10,fontWeight:700,color:"#777"}}>{betAmt}<span style={{fontSize:7,color:"#555"}}> €</span></div>)}
                  {p.folded&&betAmt<=0&&<div style={{marginTop:2,fontSize:8,color:"#555"}}>✗</div>}
                </div>
              );
            })}
          </div>
          {m3Question&&!m3HandComplete&&m3Question.type==="raise"&&(
            <div style={{background:"#0f3d25",borderRadius:8,padding:"14px 16px",border:"1px solid rgba(201,168,76,0.12)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:9,fontWeight:700,color:actionColor(m3Question.action.type).c,background:actionColor(m3Question.action.type).bg,padding:"2px 8px",borderRadius:3}}>{m3Question.action.type}</span>
                <span style={{fontSize:13,fontWeight:800,color:"#F5F0E8"}}>{m3Question.playerPos}</span>
                {m3RetryCount===1&&!m3ShowAnswer&&(<span style={{fontSize:9,fontWeight:700,color:"#FF6F00",marginLeft:"auto"}}>2e essai</span>)}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",marginBottom:3}}>Montant de la relance ?</div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input ref={m3Ref1} type="number" value={m3PotInputs[0]||""} onChange={function(e){setM3PotInputs(function(p){var c=p.slice();c[0]=e.target.value;return c;});}} onKeyDown={function(e){if(e.key==="Enter"){if(m3Question.correctRaise!=null&&m3PotInputs[0]){if(m3Ref1.current)m3Ref1.current.blur();}else if(m3PotInputs[0])m3SubmitAnswer();}}} placeholder="Montant" disabled={m3ShowAnswer} style={{flex:1,padding:"10px 14px",background:"#0a2a1a",border:m3PotWrongs[0]&&!m3PotInputs[0]?"2px solid #C62828":m3ShowAnswer&&!m3PotWrongs[0]?"2px solid #4CAF50":"2px solid rgba(201,168,76,0.2)",borderRadius:6,color:"#F5F0E8",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none"}} autoFocus/>
                    {m3ShowAnswer&&!m3PotWrongs[0]&&<span style={{fontSize:12,fontWeight:800,color:"#4CAF50"}}>OK</span>}
                    {m3ShowAnswer&&m3PotWrongs[0]&&<span style={{fontSize:12,fontWeight:800,color:"#C62828"}}>X</span>}
                  </div>
                </div>
                {m3Question.correctRaise!=null&&(
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:"#C9A84C",marginBottom:3}}>Relance américaine ?</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <input type="number" value={m3PotInputs[1]||""} onChange={function(e){setM3PotInputs(function(p){var c=p.slice();c[1]=e.target.value;return c;});}} onKeyDown={function(e){if(e.key==="Enter"&&m3PotInputs[0]&&m3PotInputs[1])m3SubmitAnswer();}} placeholder="Américaine" disabled={m3ShowAnswer} style={{flex:1,padding:"10px 14px",background:"#0a2a1a",border:m3PotWrongs[1]&&!m3PotInputs[1]?"2px solid #C62828":m3ShowAnswer&&!m3PotWrongs[1]?"2px solid #4CAF50":"2px solid rgba(201,168,76,0.2)",borderRadius:6,color:"#F5F0E8",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
                      {m3ShowAnswer&&!m3PotWrongs[1]&&<span style={{fontSize:12,fontWeight:800,color:"#4CAF50"}}>OK</span>}
                      {m3ShowAnswer&&m3PotWrongs[1]&&<span style={{fontSize:12,fontWeight:800,color:"#C62828"}}>X</span>}
                    </div>
                  </div>
                )}
                {!m3ShowAnswer?(
                  <button onClick={function(){if(!m3PotInputs[0])return;if(m3Question.correctRaise!=null&&!m3PotInputs[1])return;m3SubmitAnswer();}} style={{padding:"12px 0",width:"100%",background:(m3PotInputs[0]&&(m3Question.correctRaise==null||m3PotInputs[1]))?"#FFC107":"#333",color:"#0A0A0A",border:"none",borderRadius:6,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Valider</button>
                ):(
                  <button onClick={m3ContinueAfterError} style={{padding:"12px 0",width:"100%",background:"#FF6F00",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Continuer</button>
                )}
              </div>
            </div>
          )}
          {m3Question&&!m3HandComplete&&m3Question.type==="sidepots"&&(
            <div style={{background:"#0f3d25",borderRadius:8,padding:"14px 16px",border:"1px solid rgba(201,168,76,0.12)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:12,fontWeight:800,color:"#F5F0E8"}}>Montant des pots ?</span>
                {m3RetryCount===1&&!m3ShowAnswer&&(<span style={{fontSize:9,fontWeight:700,color:"#FF6F00",marginLeft:"auto"}}>2e essai</span>)}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {m3Question.expectedPots.map(function(sp,j){
                  var colors=["#C9A84C","#4FC3F7","#81C784","#FFB74D","#CE93D8"];var col=colors[j%colors.length];
                  var isWrong=m3PotWrongs[j];var isChanged=!m3Question.changedIndices||m3question_changedOK(m3Question.changedIndices,j);
                  var isFirstChanged=m3Question.changedIndices&&m3Question.changedIndices[0]===j;
                  if(!isChanged)return null;
                  return(
                    <div key={j}>
                      <div style={{fontSize:10,fontWeight:700,color:col,marginBottom:3}}>{sp.label}</div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <input ref={isFirstChanged||j===0?m3Ref1:null} type="number" value={m3PotInputs[j]||""} onChange={function(e){var val=e.target.value;setM3PotInputs(function(prev){var copy=prev.slice();copy[j]=val;return copy;});}} onKeyDown={function(e){if(e.key==="Enter"){var allFilled=m3PotInputs.every(function(v){return v&&v.trim();});if(allFilled)m3SubmitAnswer();}}} placeholder={sp.label} disabled={m3ShowAnswer} style={{flex:1,padding:"8px 12px",background:"#0a2a1a",border:isWrong&&!m3PotInputs[j]?"2px solid #C62828":m3ShowAnswer&&!isWrong?"2px solid #4CAF50":"2px solid "+col+"33",borderRadius:6,color:"#F5F0E8",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",outline:"none"}} autoFocus={isFirstChanged||j===0}/>
                        {m3ShowAnswer&&!isWrong&&<span style={{fontSize:12,fontWeight:800,color:"#4CAF50"}}>OK</span>}
                        {m3ShowAnswer&&isWrong&&<span style={{fontSize:12,fontWeight:800,color:"#C62828"}}>X</span>}
                      </div>
                    </div>
                  );
                })}
                {!m3ShowAnswer?(
                  <button onClick={function(){var allFilled=m3PotInputs.every(function(v){return v&&v.trim();});if(!allFilled)return;m3SubmitAnswer();}} style={{padding:"12px 0",width:"100%",background:m3PotInputs.every(function(v){return v&&v.trim();})?"#FFC107":"#333",color:"#0A0A0A",border:"none",borderRadius:6,fontSize:13,fontWeight:800,cursor:m3PotInputs.every(function(v){return v&&v.trim();})?"pointer":"default",fontFamily:"'DM Sans',sans-serif"}}>Valider</button>
                ):(
                  <button onClick={m3ContinueAfterError} style={{padding:"12px 0",width:"100%",background:"#FF6F00",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Continuer</button>
                )}
              </div>
            </div>
          )}
          {m3HandComplete&&(
            <div style={{textAlign:"center",padding:"14px 0"}}>
              <button onClick={function(){setM3HandCount(function(c){return c+1;});m3StartNewHand();}} style={{padding:"12px 40px",background:"#C9A84C",color:"#0A0A0A",border:"none",borderRadius:6,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.08em",boxShadow:"0 4px 15px rgba(201,168,76,0.3)"}}>Main suivante</button>
              {m3Errors.length>0&&(<div style={{marginTop:10,fontSize:9,color:"#C62828",fontWeight:700}}>{m3Errors.length} erreur(s) cette session</div>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Helper for side pot changed indices check
function m3question_changedOK(changedIndices,j){
  return changedIndices.indexOf(j)!==-1;
}
