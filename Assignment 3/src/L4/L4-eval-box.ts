// L4-eval-box.ts
// L4 with mutation (set!) and env-box model
// Direct evaluation of letrec with mutation, define supports mutual recursion.
import { map, repeat, zipWith } from "ramda";
import { isBoolExp, isCExp, isLitExp, isNumExp, isPrimOp, isStrExp, isVarRef, isSetExp,
         isAppExp, isDefineExp, isIfExp, isLetrecExp, isLetExp, isProcExp, Binding, VarDecl, CExp, Exp, IfExp, LetrecExp, LetExp, ProcExp, Program, SetExp,
         parseL4Exp, 
         DefineExp,
         isBoundExp,
         isTimeExp,
         BoundExp,
         unparse,
         TimeExp} from "./L4-ast";
import { applyEnv, applyEnvBdg, globalEnvAddBinding, makeExtEnv, setFBinding,
            theGlobalEnv, Env, FBinding } from "./L4-env-box";
import { isClosure, makeClosure, Closure, Value, makeCompoundSExp, CompoundSExp } from "./L4-value-box";
import { applyPrimitive } from "./evalPrimitive-box";
import { first, rest, isEmpty, isNonEmptyList } from "../shared/list";
import { Result, bind, mapv, mapResult, makeFailure, makeOk, isFailure, isOk } from "../shared/result";
import { parse as p } from "../shared/parser";
import { format } from "../shared/format";
import { isError } from "../shared/type-predicates";
import { Sexp } from "s-expression";

// ========================================================
// Eval functions

const applicativeEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? applyEnv(env, exp.var) :
    isLitExp(exp) ? makeOk(exp.val as Value) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp, env) :
    isLetExp(exp) ? evalLet(exp, env) :
    isLetrecExp(exp) ? evalLetrec(exp, env) :
    isSetExp(exp) ? evalSet(exp, env) :
    isAppExp(exp) ? bind(applicativeEval(exp.rator, env), (proc: Value) =>
                        bind(mapResult((rand: CExp) => applicativeEval(rand, env), exp.rands), (args: Value[]) =>
                            applyProcedure(proc, args))) :
    isBoundExp(exp) ? evalBound(exp, env):
    isTimeExp(exp) ? evalTime(exp, env) :
    exp;

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(applicativeEval(exp.test, env), (test: Value) => 
        isTrueValue(test) ? applicativeEval(exp.then, env) : 
        applicativeEval(exp.alt, env));

const evalProc = (exp: ProcExp, env: Env): Result<Closure> =>
    makeOk(makeClosure(exp.args, exp.body, env));

// KEY: This procedure does NOT have an env parameter.
//      Instead we use the env of the closure.
const applyProcedure = (proc: Value, args: Value[]): Result<Value> =>
    isPrimOp(proc) ? applyPrimitive(proc, args) :
    isClosure(proc) ? applyClosure(proc, args) :
    makeFailure(`Bad procedure ${format(proc)}`);

const applyClosure = (proc: Closure, args: Value[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalSequence(proc.body, makeExtEnv(vars, args, proc.env));
}

// Evaluate a sequence of expressions (in a program)
export const evalSequence = (seq: Exp[], env: Env): Result<Value> =>
    isNonEmptyList<Exp>(seq) ? evalCExps(first(seq), rest(seq), env) : 
    makeFailure("Empty program");
    
const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isDefineExp(first) ? evalDefineExps(first, rest) :
    isCExp(first) && isEmpty(rest) ? applicativeEval(first, env) :
    isCExp(first) ? bind(applicativeEval(first, env), _ => evalSequence(rest, env)) :
    first;

// Eval a sequence of expressions when the first exp is a Define.
// Compute the rhs of the define, extend the env with the new binding
// then compute the rest of the exps in the new env.
// L4-BOX @@
// define always updates theGlobalEnv
// We also only expect defineExps at the top level.
const evalDefineExps = (def: DefineExp, exps: Exp[]): Result<Value> =>
    bind(applicativeEval(def.val, theGlobalEnv), (rhs: Value) => { 
            globalEnvAddBinding(def.var.var, rhs);
            return evalSequence(exps, theGlobalEnv); 
        });

// Main program
// L4-BOX @@ Use GE instead of empty-env
export const evalProgram = (program: Program): Result<Value> =>
    evalSequence(program.exps, theGlobalEnv);

export const evalParse = (s: string): Result<Value> =>
    bind(p(s), (x) =>
            bind(parseL4Exp(x), (exp: Exp) =>
                evalSequence([exp], theGlobalEnv)));

// LET: Direct evaluation rule without syntax expansion
// compute the values, extend the env, eval the body.
const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    const vals = mapResult((v: CExp) => applicativeEval(v, env), map((b: Binding) => b.val, exp.bindings));
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return bind(vals, (vals: Value[]) => evalSequence(exp.body, makeExtEnv(vars, vals, env)));
}

// @@ L4-EVAL-BOX 
// LETREC: Direct evaluation rule without syntax expansion
// 1. extend the env with vars initialized to void (temporary value)
// 2. compute the vals in the new extended env
// 3. update the bindings of the vars to the computed vals
// 4. compute body in extended env
const evalLetrec = (exp: LetrecExp, env: Env): Result<Value> => {
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    const vals = map((b: Binding) => b.val, exp.bindings);
    const extEnv = makeExtEnv(vars, repeat(undefined, vars.length), env);
    // @@ Compute the vals in the extended env
    const cvalsResult = mapResult((v: CExp) => applicativeEval(v, extEnv), vals);
    const result = mapv(cvalsResult, (cvals: Value[]) => 
                        zipWith((bdg, cval) => setFBinding(bdg, cval), extEnv.frame.fbindings, cvals));
    return bind(result, _ => evalSequence(exp.body, extEnv));
};

// L4-eval-box: Handling of mutation with set!
const evalSet = (exp: SetExp, env: Env): Result<void> =>
    bind(applicativeEval(exp.val, env), (val: Value) =>
        mapv(applyEnvBdg(env, exp.var.var), (bdg: FBinding) =>
            setFBinding(bdg, val)));

// HW3 complete this function.
const evalBound = (exp: BoundExp, env: Env): Result<boolean> =>
    isOk(applyEnv(env, exp.var.var)) ? makeOk(true) :
    makeOk(false);

// HW3 complete this function.
const evalTime = (exp: TimeExp, env: Env): Result<CompoundSExp> => {
    const begin = new Date();
    const val = applicativeEval(exp.exp, env);
    const end = new Date();
    if(isOk(val)){
        return makeOk(makeCompoundSExp(val.value, end.getTime() - begin.getTime()));
    }
    return makeFailure("applicativeEval Failed");
}