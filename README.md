# clisp-interpreter, Kellie Dinh
### A Common Lisp interpreter written in JavaScript

## How to run
Once in the clisp-interpreter folder, run
`node repl.js`

If node is not installed, it can be installed via [Homebrew](https://brew.sh/) 
`brew install node`.

Testing suite is up-to-date: run `npm run test`

Quit using `(quit)` or `(QUIT)`

## What it does

In depth paper included as Senior_Project.pdf

### Updated 4/19/19
* Loading a file
    * (load 'lisp-file.lisp) loads in a file called 'lisp-file.lisp' however the extension doesn't matter for this program, as long as the filename is prefixed with a quote symbol
* Defining new functions
    * Can only be on one line i.e. (defun averageNum (n1 n2 n3 n4) (/ (+ n1 n2 n3 n4) 4))
    * Calling a user-defined function binds the local variable name with that value
        * (averageNum 1 2 3 4) binds parameters n1 to 1, n2 to 2, n3 to 3, n4 to 4
* Setting new global variables using setq
    * (setq a 1 b 2 c 3) sets a to 1, b to 2, c to 3
    * (setq a 3) updates the value of a to 3

* List operators cdr and cons
    * (car (cdr (cdr '(a b c d))))

* Better and more informative error messages that don't crash the program

#### End update

* Evaluation of number atoms
    * 5, +5, -5

* Basic calculations involving addition, subtraction, multiplication, and integer divison.
* Able to handle multiple arguments to +, -, *
  * (+ 1 2 3)
  * (- 3 2 1)
  * (* 3 3 3)

* Integer division handles only two arguements.
  * (/ 6 3)

* Nested expressions
  * addition (+ 3 (+ 2 9)) = 11
  * multiple operators (+ 8 (* 3 3)) = 17
  * more than two arguments to a nested expression 
    * (+ 5 (+ 2 3 4)) = 14
    * (/ 8 (* 1 2 1)) = 4
    * (+ (- 5 4) (+ 1 3)) = 5

* Truth evaluations: > , <, >=, <=,$ =, equal, /=

* Quote, null, nil

* Basic list operators: listp, cons, list
    * (list (+ 3 2) 4 9) = (5 4 9)

* If statements: 
    * (if (< 3 4) (+ 1 2) (/ 5 8)) = 3
    * (if (< (+ 3 4) (- 20 4)) (3) (4)) = 3
    
* Global variables
   * (setq x 5)
   * (+ 1 x) /* should print 6 */

More examples are included in my testing suite in the file klisp.test.js
  
### Error Handling
Implemented as a Node module defined in the file error.js

Custom-defined errors that print messages but do not end the program

### Not implemented
* Parenthesis matching
* Allow user to continue input if they leave off a closing parenthesis
* Local variables - let, do, function, progn, lambdas
* Can not handle recursion - our-member test function infinitely runs.
* Double quotes do not work
