import { CHIP_VALUES, EUROPEAN_BET_TYPES } from "./rulesets";
import { calculateTotalPayout } from "./selectors";
import type { RouletteBet, RouletteBetType, RouletteRound } from "./types";
function randomInt(m:number):number{return Math.floor(Math.random()*m);}
function randomFrom<T>(v:readonly T[]):T{return v[randomInt(v.length)];}
function getAvailableTypes(d:number):RouletteBetType[]{if(d<=1)return["straight","red","black","even","odd"];if(d<=3)return["straight","split","street","dozen","column","red","black","even","odd","low","high"];return Object.keys(EUROPEAN_BET_TYPES) as RouletteBetType[];}
function generateNumbers(t:RouletteBetType):number[]{switch(t){case"straight":return[randomInt(37)];case"split":{const r=randomInt(3),c=randomInt(11),f=r+c*3+1,s=f+(Math.random()>0.5&&r<2?1:3);return s<=36?[f,s]:[f,f-1];}case"street":{const c=randomInt(12);return[c*3+1,c*3+2,c*3+3];}case"corner":{const r=randomInt(2),c=randomInt(11),b=r+c*3+1;return[b,b+1,b+3,b+4];}case"sixLine":{const c=randomInt(11),b=c*3+1;return[b,b+1,b+2,b+3,b+4,b+5];}case"dozen":{const i=randomInt(3);return Array.from({length:12},(_,o)=>i*12+o+1);}case"column":{const i=randomInt(3);return Array.from({length:12},(_,o)=>i+1+o*3);}default:return[];}}
export function generateRandomBets(d:number):RouletteBet[]{const t=getAvailableTypes(d),cp=CHIP_VALUES.slice(0,Math.min(d+1,CHIP_VALUES.length)),n=d<=1?1:d<=3?randomInt(2)+2:randomInt(3)+3;return Array.from({length:n},(_,i)=>{const type=randomFrom(t),cv=randomFrom(cp);return{id:`bet-${i}`,type,amount:cv*(randomInt(3)+1),numbers:generateNumbers(type)};});}
export function generateWinningNumber():number{return randomInt(37);}
export function buildRound(d:number):RouletteRound{const b=generateRandomBets(d),w=generateWinningNumber();return{bets:b,winningNumber:w,correctAnswer:calculateTotalPayout(b,w)};}
