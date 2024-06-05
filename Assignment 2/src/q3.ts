import {  makeIfExp, makeDefineExp, makeProcExp, isCondExp, isIfExp, makeLetExp, makeProgram, unparseL31, parseL31CExp, CExp, isAppExp, CondExp, makeNumExp,
          isDefineExp, isProcExp, isEClause, isProgram, isExp, makeAppExp, Exp, IfExp, makeCondExp, isLetExp, isCExp, isAtomicExp, isLitExp, Program, } from "./L31-ast";
import { makeOk, Result, isOk } from "../shared/result";
import { map } from "ramda";
import parse from "s-expression";

/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
  isProgram(exp) ? makeOk(makeProgram(map(TransformExpC, exp.exps))) :
  isExp(exp) ? makeOk(TransformExpC(exp)) :
  exp;

const TransformExpC = (exp: Exp): Exp =>
  isDefineExp(exp) ? makeDefineExp(exp.var, TransformCExpC(exp.val)) :
  isCExp(exp) ? TransformCExpC(exp) :
  exp;

const TransformCExpC = (exp: CExp): CExp => 
  isProcExp(exp) ? makeProcExp(exp.args, map(TransformCExpC, exp.body)) :
  isAtomicExp(exp) ? exp :
  isAppExp(exp) ? makeAppExp(TransformCExpC(exp.rator), map(TransformCExpC, exp.rands)) :
  isIfExp(exp) ? makeIfExp(TransformCExpC(exp.test), TransformCExpC(exp.then), TransformCExpC(exp.alt)) :
  isCondExp(exp) ? TransformCExpC(Transform2if(exp)) :
  isLitExp(exp) ? exp :
  isEClause(exp) ? exp.then :
  isLetExp(exp) ? makeLetExp(exp.bindings, exp.body) :
  exp;

export const Transform2if = (exp: CondExp): IfExp => { 
  if(exp.cclauses.length > 1)
    return  makeIfExp(exp.cclauses[0].test, exp.cclauses[0].then[0], makeCondExp(exp.cclauses.slice(1), exp.eClause));
  else
    return makeIfExp(exp.cclauses[0].test, exp.cclauses[0].then[0], fix(exp.eClause.then))
};
    
const fix = (exp : CExp): CExp => {
  const  fixed = parseL31CExp(parse(unparseL31(exp).slice(1, -2)))
  if(isOk(fixed))
    return fixed.value
  return makeNumExp(5)
}
    