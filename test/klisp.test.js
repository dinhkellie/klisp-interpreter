var assert = require('Chai').assert;
var klisp = require('../klisp').klisp;

var test = function (input) {
    var out = klisp.output(klisp.parse(input));
    return klisp.library.print(out, output = "");
}

var test_out = function (input) {
    var out = klisp.output(klisp.parse(input));
    return out;
}

describe('Parsing whitespace', function () {
    it('Whitespace at beginning', function () {
        assert.equal(test("( + 1 2)"), 3, "addition");
    })

    it('Whitespace at end', function () {
        assert.equal(test("(+ 1 2 ) "), 3, "addition");
    })

    it('Parsing +1 as 1', function() {

        assert.equal(test(" +1"), 1, "+1");
        assert.equal(test("(+ 12 +1 3)"), 16, "+1");
    })
})

describe('Arithmetic operators', function () {
    it('Basic unnested two arguments ', function () {

        assert.equal(test("(+ 3 2)"), 5, "addition");
        assert.equal(test("(+ 12 34)"), 46, "addition");
        assert.equal(test("(- 5 2)"), 3, "subtraction");
        assert.equal(test("(* 3 2)"), 6, "multiplication");
        assert.equal(test("(/ 6 3)"), 2, "division");
        assert.equal(test("(/ 1 2)"), "0", "fractions round down to nearest integer");
        assert.equal(test("(+ 3 a)"), "error! a is an unbound symbol", "Using a variable before it was set with a value");
    })

    it('Multiple arguments', function () {
        assert.equal(test("(* 1 2 3 4 5)"), "120", "multiple args to multiply");
        assert.equal(test("(* 2 (+ 1 2 3))"), "12", "multiple nested");
    })

    it('Tests number and type of arguments', function() {
        assert.equal(test("(/ 3 4 5)"), "error! incorrect number of arguments", "more than 2 args to division");
        assert.equal(test("(/ 4 0)"), "error! Divide by zero", "divide by zero");

    })

    it('Nested operator expressions', function () {

        assert.equal(test("(+ 3 (+ 2 3))"), 8, "nested as 2nd argument");
        assert.equal(test("(+ 3 (+ 2 (+ 3 2)))"), "10", "multiple nested expressions");
        assert.equal(test("(+ (+ 3 2) (- 5 4))"), 6, "two nested arguments");
        assert.equal(test("(+ 3 (- 3 2) (- 5 4))"), 5, "three total arguments, two nested");
        assert.equal(test("(- (+ 4 3) (+ 2 3))"), 2, "three total arguments, two nested with different operators");
        assert.equal(test("(/ (- 4 2) (+ 5 3))"), 0, "two arguments, each own list + different operator")
    })
})

describe('Quote operator', function() {

    it('Using quote word', function() {
        assert.equal(test("(quote 5)"), 5, "single argument");
        assert.equal(test("(quote (+ 3 5))"), "(+ 3 5)", "expression");
        assert.equal(test("(quote (+ 3 (+ 3 2)))"), "(+ 3 (+ 3 2))", "nested expression");
    })

    it("Using quote symbol (')", function() {
        assert.equal(test("'5"), 5, "single element");
        assert.equal(test("'(+ 3 5)"), "(+ 3 5)", "expression");
        assert.equal(test("'(+ 3 (+ 3 2))"), "(+ 3 (+ 3 2))", "nested expression");

        assert.equal(test("'hi"), "HI", "simple character");
        assert.equal(test("(quote hi)"), "HI", "using word");
        assert.equal(test("'artichoke"), "ARTICHOKE", "word");
        assert.equal(test("'quote"), "QUOTE", "quote symbol with word");
        assert.equal(test("'(+ 1 2)"), "(+ 1 2)", "does not evaluate quoted expressions");
    })
})

describe('Truth evaluations', function() {
    it('Using null', function() {
        assert.equal(test("(null ())"), "T", "null with empty input");
        assert.equal(test("(null '(a b c))"), "NIL", "quoted list");
        assert.equal(test("(null 5)"), "NIL", "single element");
        assert.equal(test("(null (+ 1 2))"), "NIL", "expression");
    })

    it('Using nil', function() {
        assert.equal(test("(nil ())"), "T", "null with empty input");
        assert.equal(test("(nil '(a b c))"), "NIL", "quoted list");
        assert.equal(test("(nil 5)"), "NIL", "single element");
        assert.equal(test("(nil (+ 1 2))"), "NIL", "expression");
    })

    it ('Uses equal and not equal', function() {
        assert.equal(test("(= (+ 2 2) (* 2 2))"), "T");
        assert.equal(test("(/= (+ 3 4) (- 10 3))"), "NIL");
    })

    it ('Uses and & or', function() {
        assert.equal(test("(and 1 2)"), "2");
        assert.equal(test("(and NIL)"), "NIL");
        assert.equal(test("(and (= 1 1) 2 3 4)"), "4");
        assert.equal(test("(and t (+ 1 2))"), "3");
        assert.equal(test("(and nil var)"), "NIL", "correctly stops evaluation after first nil value");

        assert.equal(test("(or (listp '(a b c)) (listp 1))"), "T");
        assert.equal(test("(or (listp 3) (listp 1))"), "NIL");
        assert.equal(test("(or nil t)"), "T");

    })
})

describe('If statements', function() {
    it('Using listp and null', function() {
        assert.equal(test("(if (listp '(a b c)) (+ 1 2) (+ 5 6)"), "3", "quoted");
        assert.equal(test("(if (listp 3) (+ 1 2) (/ 5 8)"), "0", "quoted division of single element to listp");
        assert.equal(test("(if (listp 'x) x (+ 2 3))"), "5", "");
        assert.equal(test("(if (null ()) (+ 1 2) (+ 5 6))"), "3", "null of empty list");
        assert.equal(test("(if (null '(a b c)) (0) (1)"), "1", "quoted list");
    })

    it('Using truth evaluations', function() {
        assert.equal(test("(if (< 3 4) (+ 1 2) (/ 5 8))"), "3", "arithmetic");
        assert.equal(test("(if (< (+ 3 4) (- 20 4)) (3) (4))"), "3", "multiple nested expressions to if");
    })
})

describe('List operators', function() {

    it('Using cons', function() {
        // should error
        assert.equal(test("(cons (+ 3 2) (- 5 3))"), "error! Second argument to cons is not a list - Argument should be a list.", "cons with arithmetic expressions");
        assert.equal(test("(cons '1 (+ 3 2))"), "Second argument to cons is not a list - error! Argument should be a list. ", "first element is quoted and second is arithmetic");
        // assert.equal(test("(cons 'a (cons 'b nil))"), "(A B)", "nested quoted cons"); // DOES NOT WORK
        assert.equal(test("(cons 1 nil)"), "(1)", "second argument nil");
        assert.equal(test("(cons (+ 3 2) nil)"), "(5)", "first argument expression second is nil");
        assert.equal(test("(cons 'A '(B C D))"), ("(A B C D)"), "both arguments quoted");
        assert.equal(test("(cons (+ 3 3) '(A))"), "(6 A)", "first argument is an expression with quoted list");
        assert.equal(test("(cons (+ 2 4) '(A B C))"), "(6 A B C)", "expression with longer list");
    })

    it('Using list', function() {
        assert.equal(test("(list 1 2 3)"), "(1 2 3)", "add 3 elements");
        assert.equal(test("(list (+ 3 2) 4 9)"), "(5 4 9)", "one element is expression");
        assert.equal(test("(list 'A 'B 'C)"), "(A B C)", "using quoted vars");
        assert.equal(test("(list 'MY 3 'SONS)"), "(MY 3 SONS)", "using quoted vars and numbers");
        assert.equal(test("(list 'A 'B 3)"), "(A B 3)", "");
        // Tests when the first element of the list is a number and not a symbol
        assert.equal(test("(1 2 3)"), "error! Unexpected head of list: 1 - input error");

    })

    it('Using listp', function() {
        assert.equal(test("(listp 27)"), "NIL", "single element");
        assert.equal(test("(listp (+ 3 2)"), "NIL", "single element expression");
        assert.equal(test("(listp '(a b c))"), "T", "quoted list");
        assert.equal(test("(listp '(+ 1 2))"), "T", "quoted expression");
    })

    it ('Using car and cdr', function () {
        assert.equal(test("(car '(a b c))"), "A", "simple list car");
        assert.equal(test("(cdr '(A B C)"), "(B C)", 'simple list cdr');
        assert.equal(test("(car (cdr (cdr '(a b c d))))"), "C", "nested car and cdr");
    })
    
})

describe('Creating variables', function() {

    it('Tests unassigned variables', function() {
        assert.equal(test("x"), "error! x is an unbound symbol", "unassigned variable");
        assert.equal(test("(x)"), "error! x is an unbound symbol", "unassigned variable within parens");
    })

    it('Uses setq', function() {
        assert.equal(test("(setq x 5)"), "5", "sets x to 5");
        assert.equal(test("x"), "5", "tests that x was set correctly");

        assert.equal(test("(+ x 4)"), "9", "uses variable value in expression");

        assert.equal(test("(setq y (+ 3 4))"), 7, "setq used with expression value");
        assert.equal(test("y"), 7, "tests that y was set correctly");
        assert.equal(test("(setq z '(A B C))"), "(A B C)", "setq with list as value");
        assert.equal(test("z"), "(A B C)", "tests that z list was set correctly");

        assert.equal(test("(setq x 6)"), "6", "reassigning value to x");
        assert.equal(test("x"), "6", "reassigns value from 5 to 6");

        assert.equal(test("(setq b 2 c 3)"), "3", "setq for two variables");

        assert.equal(test("(setq d 4 e (+ d 1))"), "5", "uses previous value");
  
        assert.equal(test("(setq a 1 b 2 c 3)"), "3", "sets a b and c");
        assert.equal(test("(list a b c)"), "(1 2 3)", "creates list based on setq variables");

        assert.equal(test("(setq a 1 b 2 c 3 d 7 e 5 f 19)"), "19");
        assert.equal(test("(list a b c d e f)"), "(1 2 3 7 5 19)");

    })

    
})

describe('Using defun', function() {
    it('tests general defun output', function() {
        assert.equal(test("(defun square (x) (* x x))"), "SQUARE", "square");
        assert.equal(test("(square 4)"), "16", "4 * 4 = 16")

        assert.equal(test("(defun averageNum (n1 n2 n3 n4) (/ (+ n1 n2 n3 n4) 4) )"), "AVERAGENUM");
        assert.equal(test("(averageNum 10 100 1000 10000)"), "2777");

        assert.equal(test("(defun our-third (x) (car (cdr (cdr x))))"), "OUR-THIRD");
        assert.equal(test("(our-third '(1 2 3 4)"), "3");

        assert.equal(test("(defun sum-greater (x y z) (> (+ x y) z))"), "SUM-GREATER");
        assert.equal(test("(sum-greater 1 4 3)"), "T");
    })
})

describe('General program behavior', function() {
    it('Makes sure quit works', function() {
        assert.equal(test_out("(quit)"), "quit", "basic quit function");
        assert.equal(test_out("( quit )"), "quit", "spaces around word quit");
        assert.equal(test_out("( quit ) "), "quit", "spaces around word and after parens");
    })

    it('Empty input', function() {
        assert.equal(test("()"), "NIL", "empty input parens");
        assert.equal(test(" "), "", "empty input");
    })
})