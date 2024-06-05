#lang racket

(require rackunit)

(provide (all-defined-out))

(define integers-from
  (lambda (n)
    (cons-lzl n (lambda () (integers-from (+ n 1))))))

(define cons-lzl cons)
(define empty-lzl? empty?)
(define empty-lzl '())
(define head car)
(define tail
  (lambda (lzl)
    ((cdr lzl))))

(define leaf? (lambda (x) (not (list? x))))

;; Signature: map-lzl(f, lz)
;; Type: [[T1 -> T2] * Lzl(T1) -> Lzl(T2)]
(define map-lzl
  (lambda (f lzl)
    (if (empty-lzl? lzl)
        lzl
        (cons-lzl (f (head lzl))
                  (lambda () (map-lzl f (tail lzl)))))))

;; Signature: take(lz-lst,n)
;; Type: [LzL*Number -> List]
;; If n > length(lz-lst) then the result is lz-lst as a List
(define take
  (lambda (lz-lst n)
    (if (or (= n 0) (empty-lzl? lz-lst))
      empty-lzl
      (cons (head lz-lst)
            (take (tail lz-lst) (- n 1))))))

; Signature: nth(lz-lst,n)
;; Type: [LzL*Number -> T]
;; Pre-condition: n < length(lz-lst)
(define nth
  (lambda (lz-lst n)
    (if (= n 0)
        (head lz-lst)
        (nth (tail lz-lst) (- n 1)))))


;;; Q1.1
; Signature: append$(lst1, lst2, cont) 
; Type: [List * List * [List -> T]] -> T
; Purpose: Returns the concatination of the given two lists, with cont pre-processing
(define append$
  (lambda (lst1 lst2 cont)
    (if (empty? lst1) ;lst1 empty
        (cont lst2)
        (append$ (cdr lst1) lst2 (lambda (res)
                                    (cont (cons (car lst1) res)))))
  )
)

;;; Q1.2
; Signature: equal-trees$(tree1, tree2, succ, fail) 
; Type: [Tree * Tree * [Tree -> T1] * [Pair -> T2] -> T1 U T2]
; Purpose: Determines the structure identity of a given two trees, with post-processing succ/fail
(define equal-trees$ 
  (lambda (tree1 tree2 succ fail)
    (cond
      ;both trees empty
      ((and (empty? tree1) (empty? tree2))
       (succ '()))
      
      ;only tree1 empty
      ((and (empty? tree1) (not (empty? tree2)))
       (fail (cons tree1 tree2)))
      
      ;only tree2 empty
      ((and (empty? tree2) (not (empty? tree1)))
       (fail (cons tree1 tree2)))

      ; both trees leaf
      ((and (leaf? tree1) (leaf? tree2))
       (succ (cons tree1 tree2)))

      ;only tree1 leaf
      ((and (leaf? tree1) (list? tree2))
       (fail (cons tree1 tree2)))

      ;only tree2 leaf
      ((and (leaf? tree2) (list? tree1))
       (fail (cons tree1 tree2)))
      
      ;both trees compound 
      (else (equal-trees$ (car tree1) (car tree2) (lambda (res-succ-car)
                                                    (equal-trees$ (cdr tree1) (cdr tree2) (lambda (res-succ-cdr)
                                                                                            (succ (cons res-succ-car res-succ-cdr)))
                                                                  fail))
                          fail)))
    )
)

;;; Q2.1
;; Signature: as-real(x)
;; Type: [ Number -> Lzl(Number) ]
;; Purpose: Convert a rational number to its form as a
;; constant real number
(define as-real
  (lambda (x)
    (cons x (lambda () (as-real x)))
  )
)


;; Signature: ++(x, y)
;; Type: [ Lzl(Number) * Lzl(Number) -> Lzl(Number) ]
;; Purpose: Addition of real numbers
(define ++
  (lambda (x y)
      ;both lzl are compound
      (cons (+ (head x) (head y)) (lambda () (++ (tail x) (tail y))))
  )
)

;; Signature: --(x, y)
;; Type: [ Lzl(Number) * Lzl(Number) -> Lzl(Number) ]
;; Purpose: Subtraction of real numbers
(define --
  (lambda (x y)
      ;both lzl are compound
      (cons (- (head x) (head y)) (lambda () (-- (tail x) (tail y))))
  )
)

;; Signature: **(x, y)
;; Type: [ Lzl(Number) * Lzl(Number) -> Lzl(Number) ]
;; Purpose: Multiplication of real numbers
(define **
  (lambda (x y)
      ;both lzl are compound
      (cons (* (head x) (head y)) (lambda () (** (tail x) (tail y))))
  )
)
;; Signature: //(x, y)
;; Type: [ Lzl(Number) * Lzl(Number) -> Lzl(Number) ]
;; Purpose: Division of real numbers
(define //
  (lambda (x y)
      ;both lzl are compound
      (cons (/ (head x) (head y)) (lambda () (// (tail x) (tail y))))
  )
)

;;; Q2.2.a
;; Signature: sqrt-with(x y)
;; Type: [ Lzl(Number) * Lzl(Number) -> Lzl(Lzl(Number)) ]
;; Purpose: Using an initial approximation `y`, return a 
;; sequence of real numbers which converges into the 
;; square root of `x`
(define sqrt-with
  (lambda (x y)
           (cons-lzl y (lambda () (sqrt-with x (N-R-Equa x y))));next computation
  )
)

;; Newton-Raphson approximation
;; Signature: N-R-Equa(x y)
;; Type: [ Lzl(Number) * Lzl(Number) -> Lzl(Number) ]
;; Purpose: calculate the next y by using Newton-Raphson approximation
(define N-R-Equa
  (lambda (x y)
    (// (++ (** y y) x) (*** 2 y))
  )
)

;; Signature: ***(x, y)
;; Type: [ Number * Lzl(Number) -> Lzl(Number) ]
;; Purpose: Multiplication of real numbers
(define ***
  (lambda (x y)
    (cond      
      ;lzl y empty
      ((and (empty-lzl? y) (not (empty-lzl? x)))
       x)

      ;lzl y contains 1 element
      ((and (empty-lzl? (tail y)) (not (leaf? x)))
       (* (* (y x)) (lambda () (*** empty-lzl x))))
      
      ;both lzl are compound
      (else (cons (* x (head y)) (lambda () (*** x (tail y)))))
    )
  )
)

;;; Q2.2.b
;; Signature: diag(lzl)
;; Type: [ Lzl(Lzl(T)) -> Lzl(T) ]
;; Purpose: Diagonalize an infinite lazy list
(define diag
  (lambda (lzl)
    ;calculate diagonal start of first (top left) element
    ;(nth-diag lzl 0)
    (cons-lzl (head (head lzl))
              (lambda ()
                (diag (tail (map-lzl tail lzl)))))
  )
)

(define nth-diag
  (lambda (lzl n)
    (cond
      ;lzl empty
      ((empty-lzl? lzl)
       '())
      
      ;next lzl empty
      ((empty-lzl? (tail lzl))
       '())

      ;calculate diagonal
      (else (cons-lzl (nth (head lzl) n) (lambda () (nth-diag (tail lzl) (+ n 1))))))
  )
)

;;; Q2.2.c
;; Signature: rsqrt(x)
;; Type: [ Lzl(Number) -> Lzl(Number) ]
;; Purpose: Take a real number and return its square root
;; Example: (take (rsqrt (as-real 4.0)) 6) => '(4.0 2.5 2.05 2.0006097560975613 2.0000000929222947 2.000000000000002)
(define rsqrt
  (lambda (x)
    (diag (sqrt-with x (as-real 3)))
  )
)