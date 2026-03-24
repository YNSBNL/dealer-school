"use client";

import { useState, useEffect, useRef } from "react";
import SimulatorHeader from "@/components/SimulatorHeader";
import { saveSession } from "@/lib/api";

// -- ENGINE --
const SUITS=["S","H","D","C"],SC={"S":"#1a1a1a","H":"#C62828","D":"#C62828","C":"#1a1a1a"};
const SUIT_SYM={"S":"\u2660","H":"\u2665","D":"\u2666","C":"\u2663"};
const RANKS=["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const RV={"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14};
const HN={9:"Quinte Flush Royale",8:"Quinte Flush",7:"Carre",6:"Full",5:"Couleur",4:"Suite",3:"Brelan",2:"Deux Paires",1:"Paire",0:"Carte Haute"};
const ALL_HANDS=Object.values(HN);

function mkDeck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,id:`${r}${s}${Math.random()}`});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function combos(c,n=5){const r=[];function f(s,o){if(o.length===n){r.push([...o]);return;}for(let i=s;i<c.length;i++){o.push(c[i]);f(i+1,o);o.pop();}}f(0,[]);return r;}
function ev5(c){const v=c.map(x=>RV[x.rank]).sort((a,b)=>b-a),su=c.map(x=>x.suit),fl=su.every(s=>s===su[0]);let st=false,sh=0;const u=[...new Set(v)].sort((a,b)=>b-a);if(u.length>=5){for(let i=0;i<=u.length-5;i++)if(u[i]-u[i+4]===4){st=true;sh=u[i];break;}if(!st&&u.includes(14)&&u.includes(2)&&u.includes(3)&&u.includes(4)&&u.includes(5)){st=true;sh=5;}}const ct={};v.forEach(x=>{ct[x]=(ct[x]||0)+1;});const g=Object.entries(ct).map(([k,c])=>({v:+k,c}));g.sort((a,b)=>b.c-a.c||b.v-a.v);if(fl&&st&&sh===14)return{rank:9,k:[14]};if(fl&&st)return{rank:8,k:[sh]};if(g[0].c===4)return{rank:7,k:[g[0].v,g[1].v]};if(g[0].c===3&&g[1].c===2)return{rank:6,k:[g[0].v,g[1].v]};if(fl)return{rank:5,k:v.slice(0,5)};if(st)return{rank:4,k:[sh]};if(g[0].c===3){const k=g.filter(x=>x.c===1).map(x=>x.v).sort((a,b)=>b-a);return{rank:3,k:[g[0].v,...k.slice(0,2)]};}if(g[0].c===2&&g[1].c===2){const k=g.find(x=>x.c===1);return{rank:2,k:[Math.max(g[0].v,g[1].v),Math.min(g[0].v,g[1].v),k?k.v:0]};}if(g[0].c===2){const k=g.filter(x=>x.c===1).map(x=>x.v).sort((a,b)=>b-a);return{rank:1,k:[g[0].v,...k.slice(0,3)]};}return{rank:0,k:v.slice(0,5)};}
function best7(c){if(c.length<5)return null;let b=null;for(const co of combos(c,5)){const e=ev5(co);if(!b||cmpH(e,b)>0)b=e;}return b;}
function cmpH(a,b){if(a.rank!==b.rank)return a.rank-b.rank;for(let i=0;i<Math.min(a.k.length,b.k.length);i++)if(a.k[i]!==b.k[i])return a.k[i]-b.k[i];return 0;}

function maxBoardHand(board){
  const usedIds=new Set(board.map(c=>c.rank+c.suit));
  const remaining=[];
  for(const s of SUITS)for(const r of RANKS){if(!usedIds.has(r+s))remaining.push({rank:r,suit:s,id:`${r}${s}max`});}
  let best=best7(board);
  if(best&&best.rank===9)return best;
  for(let i=0;i<remaining.length;i++){
    const h=[...board,remaining[i]];
    const e=best7(h);
    if(e&&(!best||cmpH(e,best)>0)){best=e;if(best.rank===9)return best;}
  }
  for(let i=0;i<remaining.length;i++){
    for(let j=i+1;j<remaining.length;j++){
      const h=[...board,remaining[i],remaining[j]];
      const e=best7(h);
      if(e&&(!best||cmpH(e,best)>0)){best=e;if(best.rank===9)return best;}
    }
  }
  return best;
}

// -- CARD --
const FACE={"J":"\u265E","Q":"\u2655","K":"\u265A"};
function PokerCard({card,size="md"}){
  const S={
    sm:{w:48,h:68,r:6,fi:14,si:11,ci:20,p:"4px"},
    md:{w:62,h:88,r:7,fi:18,si:14,ci:26,p:"5px 6px"},
    lg:{w:74,h:106,r:8,fi:22,si:16,ci:32,p:"6px 7px"}
  };
  const z=S[size]||S.md;
  const col=SC[card.suit];
  const isRed=card.suit==="H"||card.suit==="D";
  const isFace=FACE[card.rank];
  const sym=SUIT_SYM[card.suit];
  return(
    <div style={{
      width:z.w,height:z.h,borderRadius:z.r,
      background:isFace?"linear-gradient(170deg,#FFFDF7 0%,#F5F0E0 100%)":"#FFFEF9",
      color:col,
      border:isRed?"1.5px solid #e0c4c4":"1.5px solid #c0c0c0",
      padding:z.p,display:"flex",flexDirection:"column",justifyContent:"space-between",
      boxShadow:"0 4px 16px rgba(0,0,0,0.25),0 1px 3px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.6)",
      fontFamily:"'Playfair Display',Georgia,serif",flexShrink:0,position:"relative",
      transition:"transform 0.15s ease"
    }}>
      <div style={{lineHeight:1,display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}>
        <div style={{fontSize:z.fi,fontWeight:900,letterSpacing:"-0.02em"}}>{card.rank}</div>
        <div style={{fontSize:z.si,marginTop:-1,opacity:0.85}}>{sym}</div>
      </div>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:isFace?z.ci+6:z.ci,lineHeight:1,opacity:isFace?0.2:0.65}}>
        {isFace?FACE[card.rank]:sym}
      </div>
      <div style={{lineHeight:1,alignSelf:"flex-end",transform:"rotate(180deg)",display:"flex",flexDirection:"column",alignItems:"center",width:"fit-content"}}>
        <div style={{fontSize:z.fi,fontWeight:900,letterSpacing:"-0.02em"}}>{card.rank}</div>
        <div style={{fontSize:z.si,marginTop:-1,opacity:0.85}}>{sym}</div>
      </div>
    </div>);
}

// -- HAND MCQ --
function HandMCQ({onAnswer,disabled}){
  return(
    <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
      {ALL_HANDS.map((h,i)=>(
        <button key={i} onClick={()=>!disabled&&onAnswer(h)} disabled={disabled}
          style={{
            padding:"8px 14px",
            background:disabled?"rgba(201,168,76,0.02)":"rgba(201,168,76,0.05)",
            border:disabled?"1px solid rgba(201,168,76,0.06)":"1px solid rgba(201,168,76,0.15)",
            borderRadius:4,color:disabled?"#444":"#F5F0E8",fontSize:11,fontWeight:600,
            cursor:disabled?"default":"pointer",fontFamily:"'DM Sans',sans-serif",
            opacity:disabled?0.35:1,transition:"all 0.15s",
            letterSpacing:"0.02em"
          }}
          onMouseEnter={e=>{if(!disabled){e.currentTarget.style.background="rgba(201,168,76,0.18)";e.currentTarget.style.borderColor="rgba(201,168,76,0.35)";e.currentTarget.style.transform="translateY(-1px)";}}}
          onMouseLeave={e=>{e.currentTarget.style.background=disabled?"rgba(201,168,76,0.02)":"rgba(201,168,76,0.05)";e.currentTarget.style.borderColor=disabled?"rgba(201,168,76,0.06)":"rgba(201,168,76,0.15)";e.currentTarget.style.transform="translateY(0)";}}
        >{h}</button>
      ))}
    </div>
  );
}

// -- MAIN --
export default function TexasHoldemSimulator(){
  const [screen,setScreen]=useState("menu");
  const [board,setBoard]=useState([]);
  const [hand1,setHand1]=useState([]);
  const [hand2,setHand2]=useState([]);
  const [step,setStep]=useState("board_q");
  const [boardEval,setBoardEval]=useState(null);
  const [boardAttempt,setBoardAttempt]=useState(0);
  const [boardWrong,setBoardWrong]=useState(false);
  const [h1Eval,setH1Eval]=useState(null);
  const [h2Eval,setH2Eval]=useState(null);
  const [compareAttempt,setCompareAttempt]=useState(0);
  const [compareWrong,setCompareWrong]=useState(false);
  const [stats,setStats]=useState({rounds:0,ok:0,total:0});
  const timerRef=useRef(null);
  const logTH=(isCorrect,nStats)=>{saveSession({game_id:"casino-holdem",mode:"guidee",score:isCorrect?100:0,accuracy:nStats.total>0?Math.round(nStats.ok/nStats.total*100):0,duration_seconds:0,rounds_played:1,rounds_correct:isCorrect?1:0,errors:isCorrect?[]:["mauvaise reponse"],details:{}}).catch(()=>null);};

  const deal=()=>{
    const d=mkDeck();
    const b=[d[0],d[1],d[2],d[3],d[4]];
    const h1c=[d[5],d[6]];
    const h2c=[d[7],d[8]];
    const be=maxBoardHand(b);
    const e1=best7([...h1c,...b]);
    const e2=best7([...h2c,...b]);
    setBoard(b);setHand1(h1c);setHand2(h2c);
    setBoardEval(be);setH1Eval(e1);setH2Eval(e2);
    setStep("board_q");setBoardAttempt(0);setBoardWrong(false);
    setCompareAttempt(0);setCompareWrong(false);
    if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}
  };

  const start=()=>{setScreen("game");setStats({rounds:0,ok:0,total:0});setTimeout(()=>deal(),50);};

  const answerBoard=(ans)=>{
    if(boardWrong)return;
    const correct=ans===HN[boardEval.rank];
    if(correct){
      setStats(s=>({...s,ok:s.ok+1,total:s.total+1}));
      setStep("compare_q");
    }else{
      if(boardAttempt===0){setBoardAttempt(1);setStats(s=>({...s,total:s.total+1}));}
      else{setBoardWrong(true);setStats(s=>({...s,total:s.total+1}));timerRef.current=setTimeout(()=>{setStep("compare_q");},1200);}
    }
  };

  const answerCompare=(ans)=>{
    if(compareWrong)return;
    const comp=cmpH(h1Eval,h2Eval);
    let correctAns;
    if(comp>0)correctAns="Main 1";
    else if(comp<0)correctAns="Main 2";
    else correctAns="Egalite";
    const correct=ans===correctAns;
    if(correct){
      const ns={...stats,ok:stats.ok+1,total:stats.total+1,rounds:stats.rounds+1};setStats(ns);logTH(true,ns);
      timerRef.current=setTimeout(()=>deal(),800);
      setStep("next");
    }else{
      if(compareAttempt===0){setCompareAttempt(1);setStats(s=>({...s,total:s.total+1}));}
      else{setCompareWrong(true);const ns={...stats,total:stats.total+1,rounds:stats.rounds+1};setStats(ns);logTH(false,ns);timerRef.current=setTimeout(()=>deal(),1200);setStep("next");}
    }
  };

  useEffect(()=>{return()=>{if(timerRef.current)clearTimeout(timerRef.current);};},[]);

  const precision=stats.total>0?`${Math.round(stats.ok/stats.total*100)}%`:"--";

  // -- MENU --
  if(screen==="menu")return(
    <div className="cp-sim-shell cp-sim-page">
      <SimulatorHeader title="Texas Hold'em" badge="Simulateur - Lecture de Board" />
      <div className="cp-page-container" style={{padding:"24px 16px"}}>
        <div style={{
          background:"linear-gradient(145deg,rgba(20,20,20,0.95),rgba(14,14,14,0.95))",
          border:"1px solid rgba(201,168,76,0.1)",borderRadius:10,padding:"28px 24px",maxWidth:540,
          margin:"0 auto",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"
        }}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.25em",textTransform:"uppercase",color:"#C9A84C",marginBottom:8,opacity:0.7}}>Simulateur Croupier</div>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(1.8rem,4vw,2.6rem)",fontWeight:900,lineHeight:1.1,margin:0,color:"#F5F0E8"}}>
              Texas <span style={{color:"#C9A84C",fontStyle:"italic"}}>Hold&apos;em</span>
            </h1>
            <div style={{width:60,height:2,background:"linear-gradient(90deg,transparent,#C9A84C,transparent)",margin:"12px auto 0"}}/>
          </div>

          <div style={{fontSize:12,color:"#BFB9AD",lineHeight:1.8}}>
            <div style={{fontWeight:800,color:"#C9A84C",marginBottom:10,fontSize:13,letterSpacing:"0.06em"}}>Entrainement - Lecture de Board</div>
            <div style={{marginBottom:10,paddingLeft:4}}>
              <span style={{color:"#C9A84C",fontWeight:800,marginRight:8}}>1.</span>
              Identifie le jeu max du board - la meilleure combinaison possible avec 1 ou 2 cartes d&apos;un joueur
            </div>
            <div style={{marginBottom:10,paddingLeft:4}}>
              <span style={{color:"#C9A84C",fontWeight:800,marginRight:8}}>2.</span>
              Deux mains sont affichees - determine laquelle est la plus forte avec le board
            </div>
            <div style={{fontSize:10,color:"#666",borderTop:"1px solid rgba(201,168,76,0.06)",paddingTop:10,marginTop:4}}>2 essais par question - Le coup suivant se genere automatiquement</div>
          </div>
        </div>

        <details style={{maxWidth:540,margin:"16px auto 0"}}>
          <summary style={{fontSize:10,fontWeight:700,color:"#C9A84C",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",padding:"4px 0"}}>Hierarchie des mains</summary>
          <div style={{background:"rgba(20,20,20,0.9)",border:"1px solid rgba(201,168,76,0.08)",borderRadius:6,padding:14,marginTop:8}}>
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 14px",fontSize:11,color:"#BFB9AD",lineHeight:2}}>
              {["Quinte Flush Royale","Quinte Flush","Carre","Full","Couleur","Suite","Brelan","Deux Paires","Paire","Carte Haute"].map((h,i)=>(
                <span key={`n${i}`} style={{display:"contents"}}><span style={{fontWeight:800,color:"#C9A84C",fontFamily:"'Playfair Display',Georgia,serif",fontSize:12}}>{i+1}.</span><span>{h}</span></span>
              ))}
            </div>
          </div>
        </details>

        <div style={{textAlign:"center",marginTop:24}}>
          <button onClick={start} style={{
            padding:"14px 44px",background:"linear-gradient(135deg,#C9A84C,#B8963A)",color:"#0A0A0A",border:"none",borderRadius:5,
            fontSize:13,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
            boxShadow:"0 4px 20px rgba(201,168,76,0.25),inset 0 1px 0 rgba(255,255,255,0.2)",transition:"all 0.2s"
          }}>Commencer</button>
        </div>
      </div>
    </div>
  );

  // -- GAME --
  const showHands=step==="compare_q"||step==="next";

  return(
    <div className="cp-sim-shell cp-sim-page">
      <SimulatorHeader
        title="Texas Hold'em"
        badge="Simulateur - Lecture"
        stats={stats.total>0?`${precision} - ${stats.rounds} coups`:null}
        onBackToMenu={()=>{setScreen("menu");if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}}}
      />

      <div className="cp-page-container" style={{padding:"20px 14px",maxWidth:740,margin:"0 auto"}}>
        {/* FELT */}
        <div style={{
          background:"radial-gradient(ellipse 130% 90% at 50% 45%,#1B7355,#176A4A 30%,#135A38 55%,#0F4528 75%,#0B3320)",
          borderRadius:20,padding:"32px 28px",
          border:"5px solid rgba(201,168,76,0.2)",
          boxShadow:"inset 0 0 120px rgba(0,0,0,0.2),inset 0 2px 0 rgba(255,255,255,0.02),0 20px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(0,0,0,0.3),0 0 0 7px #0E0E0E",
          position:"relative",overflow:"hidden"
        }}>
          <div style={{position:"absolute",inset:0,opacity:0.04,pointerEvents:"none",borderRadius:16}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:16,fontWeight:800,letterSpacing:"0.35em",textTransform:"uppercase",color:"rgba(201,168,76,0.025)",fontFamily:"'Playfair Display',Georgia,serif",whiteSpace:"nowrap",pointerEvents:"none"}}>TEXAS HOLD&apos;EM</div>

          {/* BOARD */}
          <div style={{textAlign:"center",marginBottom:showHands?24:0,position:"relative",zIndex:2}}>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(201,168,76,0.45)",marginBottom:12}}>Board</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              {board.map(c=><PokerCard key={c.id} card={c} size="lg"/>)}
            </div>
          </div>

          {/* HANDS */}
          {showHands&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:16,marginTop:8,position:"relative",zIndex:2,alignItems:"center"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:"#4FC3F7",marginBottom:8}}>Main 1</div>
                <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  {hand1.map(c=><PokerCard key={c.id} card={c} size="md"/>)}
                </div>
                {(step==="next")&&h1Eval&&(
                  <div style={{marginTop:8,fontSize:10,fontWeight:700,color:"rgba(191,185,173,0.8)"}}>{HN[h1Eval.rank]}</div>
                )}
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:1,height:30,background:"linear-gradient(180deg,transparent,rgba(201,168,76,0.15),transparent)"}}/>
                <div style={{fontSize:10,fontWeight:900,color:"rgba(201,168,76,0.25)",fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:"0.1em"}}>VS</div>
                <div style={{width:1,height:30,background:"linear-gradient(180deg,transparent,rgba(201,168,76,0.15),transparent)"}}/>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:"#EF5350",marginBottom:8}}>Main 2</div>
                <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  {hand2.map(c=><PokerCard key={c.id} card={c} size="md"/>)}
                </div>
                {(step==="next")&&h2Eval&&(
                  <div style={{marginTop:8,fontSize:10,fontWeight:700,color:"rgba(191,185,173,0.8)"}}>{HN[h2Eval.rank]}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div style={{marginTop:14}}>
          {step==="board_q"&&(
            <div style={{padding:16,background:"linear-gradient(145deg,#151515,#111)",border:"1px solid rgba(201,168,76,0.1)",borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12,textAlign:"center"}}>
                Quel est le jeu max du board ?
              </div>
              {boardWrong&&<div style={{textAlign:"center",marginBottom:10}}><span style={{fontSize:20,color:"#C62828",fontWeight:900}}>X</span></div>}
              <HandMCQ onAnswer={answerBoard} disabled={boardWrong}/>
            </div>
          )}

          {step==="compare_q"&&(
            <div style={{padding:16,background:"linear-gradient(145deg,#151515,#111)",border:"1px solid rgba(201,168,76,0.1)",borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#C9A84C",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12,textAlign:"center"}}>
                Quelle main est la plus forte ?
              </div>
              {compareWrong&&<div style={{textAlign:"center",marginBottom:10}}><span style={{fontSize:20,color:"#C62828",fontWeight:900}}>X</span></div>}
              <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                {[{l:"Main 1",bg:"rgba(79,195,247,0.08)",bc:"rgba(79,195,247,0.3)",c:"#4FC3F7"},
                  {l:"Egalite",bg:"rgba(201,168,76,0.06)",bc:"rgba(201,168,76,0.25)",c:"#C9A84C"},
                  {l:"Main 2",bg:"rgba(239,83,80,0.08)",bc:"rgba(239,83,80,0.3)",c:"#EF5350"}
                ].map(({l,bg,bc,c})=>(
                  <button key={l} onClick={()=>answerCompare(l)} disabled={compareWrong}
                    style={{
                      padding:"12px 28px",background:bg,border:`1.5px solid ${bc}`,borderRadius:5,
                      fontSize:13,fontWeight:800,color:compareWrong?"#444":c,cursor:compareWrong?"default":"pointer",
                      fontFamily:"'DM Sans',sans-serif",opacity:compareWrong?0.3:1,transition:"all 0.15s",
                      letterSpacing:"0.04em"
                    }}
                  >{l}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reference */}
        <details style={{marginTop:14}}>
          <summary style={{fontSize:9,fontWeight:700,color:"#C9A84C",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",padding:"2px 0"}}>Hierarchie des mains</summary>
          <div style={{background:"rgba(20,20,20,0.9)",border:"1px solid rgba(201,168,76,0.08)",borderRadius:6,padding:14,marginTop:8}}>
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 14px",fontSize:10,color:"#BFB9AD",lineHeight:2}}>
              {["Quinte Flush Royale","Quinte Flush","Carre","Full","Couleur","Suite","Brelan","Deux Paires","Paire","Carte Haute"].map((h,i)=>(
                <span key={`n${i}`} style={{display:"contents"}}><span style={{fontWeight:800,color:"#C9A84C",fontFamily:"'Playfair Display',Georgia,serif",fontSize:11}}>{i+1}.</span><span>{h}</span></span>
              ))}
            </div>
          </div>
        </details>

        {/* Stats */}
        <div style={{marginTop:12,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {[{n:stats.rounds,l:"Coups"},{n:precision,l:"Precision"},{n:stats.ok,l:"Correct"}].map((s,i)=>(
            <div key={i} style={{background:"linear-gradient(145deg,#151515,#111)",border:"1px solid rgba(201,168,76,0.06)",borderRadius:5,padding:"8px 6px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
              <div style={{fontFamily:typeof s.n==="number"?"'Playfair Display',Georgia,serif":"'DM Sans',sans-serif",fontSize:typeof s.n==="number"?18:11,fontWeight:typeof s.n==="number"?900:700,color:"#C9A84C"}}>{s.n}</div>
              <div style={{fontSize:7,color:"#888",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:2,fontWeight:600}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
