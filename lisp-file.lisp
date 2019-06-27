(setq x 20) 
(setq y 2)

(defun perimeter (width height) (+ (* width 2) (* height 2)))

(defun factorial (n) (if (= n 1) 1 (* n (factorial (- n 1)))))
