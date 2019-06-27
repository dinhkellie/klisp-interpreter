var error = require("./error");
var alpha = /^[a-zA-Z()-]+$/; // used for regex uppercase letters


class InnerContext {

  constructor(scope = []) {
    // scope used for intermediate values i.e. nested functions
    this.scope = scope;
    this.function_in_context = undefined;
  }
};

class GlobalContext {

  constructor(scope = [], parent = []) {
    this.scope = scope;
    this.parent = parent;
  }

  // searches global variable dictionary for input variable
  get_var(input_var) {
    for (let i = 0; i < global_var.scope.length; i++) {
      if (global_var.scope[i].type === input_var || global_var.scope[i].value === input_var) {
        return global_var.scope[i];
      }
    }
    return null;
  }

  get_func(input_func) {
    for (let i = 0; i < global_functions.scope.length; i++) {
      if (global_functions.scope[i].name === input_func) {
        return global_functions.scope[i];
      }
    }
    return null;
  }

};

// Create the empty dictionaries to hold the global user-defined functions and variables
let global_var = new GlobalContext();
let global_functions = new GlobalContext();

(function (exports) {
  var library = {
    first: function (x) {
      return x[0];
    },

    rest: function (x) {
      return x.slice(1);
    },

    print: function (input, output, close_paren = false) {

      // basic string handling so that weird input does not crash the program
      if (typeof input === 'string' || input instanceof String) {
        return input;
      }

      // handle empty input and nil
      if ((input instanceof Array && input.length === 0) || input === "NIL") {
        return "NIL"
      }

      if (input instanceof Object) {
        // for single atoms
        if (!(input instanceof Array)) {
          if (input.value === "nil") {
            output += "NIL";
          } else {

            // if element is an array, append open parenthesis
            // iterate through each element in array
            // end with closed parenthesis
            if (input.value instanceof Array) {
              output += "("
              for (let i = 0; i < input.value.length; i++) {
                output += (input.value[i]).value;
                if (i != input.value.length - 1) {
                  output += " ";
                }
              }
              output += ")";
            } else if (input.value instanceof Object) {
              output += (input.value).value;
            } else {
              output += input.value;
            }
          }
        }
        // for multi-character output and nested lists
        else {

          output += "("
          for (let i = 0; i < input.length; i++) {
            // if element is an array (nested list), call print again
            // attach open parens 
            if (input[i] instanceof Array) {
              // when printing a quote, we don't want the outer parenthesis
              if (input[i][0].value === "quote") {
                return library.print(input[i], output, close_paren = false);
              } else {
                return library.print(input[i], output, close_paren = true);
              }
            } else {
              if (input[i].value === "quote") {
                output += "'"
              } else if (input[i].value instanceof Object) {
                output += (input[i].value).value;
              } else {
                output += input[i].value;
              }
              if (i != input.length - 1) {
                output += " ";
              }
            }
          }
          output += ")";
        }
      }
      if (close_paren) {
        output += ")";
      }

      // uppercase each element
      if (alpha.test(output)) {
        return output.toUpperCase();
      } else {
        return output;
      }
    }
  };

  // creates objects with type and value fields ready to be passed to evaluator
  var categorize = function (input) {
    if (!isNaN(parseFloat(input))) {
      return {
        type: 'number',
        value: parseFloat(input)
      };
    } else if (input[0] === "'") {
      return {
        type: 'symbol',
        value: 'quote'
      }
    } else {
      return {
        type: 'symbol',
        value: input
      };
    }
  };

  var setup = function () {
    // add NIL and T to global_var
    global_var.scope.push(categorize("nil"));
    global_var.scope.push(categorize("NIL"));
    global_var.scope.push(categorize("T"));
    global_var.scope.push(categorize("t"));
  };

  // Creates nested parse tree structure based on position of parenthesis in input
  var parenthesize = function (input, list) {
    var token = input.shift();

    // for quotes, we want to create a new array to keep the arguments to quote in the same array 
    if (token == "'" || token == "quote") {
      temp_list = [];
      temp_list.push(categorize(token));

      if (list === undefined) {
        return parenthesize(input, temp_list);
      } else {
        return parenthesize(input, list.concat(temp_list));
      }
    }
    // beginning of list
    if (list === undefined) {
      if (token === "(") {
        return parenthesize(input, []);
      } else {
        return parenthesize(input, [categorize(token)]);
      }
    }
    // not beginning of list, can call concat() for the rest of the elements
    else {
      if (token === "(") {
        list.push(parenthesize(input, []));
        return parenthesize(input, list);
      } else if (token === ")") {
        return list;
      } else if (token === undefined) {
        return list;
      } else {
        return parenthesize(input, list.concat(categorize(token)));
      }
    }
  };

  // Taken from https://github.com/maryrosecook/littlelisp
  var tokenize = function (input) {
    var token = input.split('"')
      .map(function (x, i) {
        if (i % 2 === 0) { // not in string
          return x.replace("'", "quote ").replace(/\(/g, ' ( ')
            .replace(/\)/g, ' ) ');
        } else { // in string
          return x.replace("'", "quote").replace(/ /g, "!whitespace!");
        }
      })
      .join('"')
      .trim()
      .split(/\s+/)
      .map(function (x) {
        return x.replace(/!whitespace!/g, " ").replace("'", "quote");
      });


    // using the above regexes, some elements are not parsed correctly with quote
    // i.e. 'b would be tokenized as 'quoteb'
    // go through each token, if the first part is quote, create another element to hold everything after quote
    quoted_indices = [];

    for (let i = 0; i < token.length; i++) {
      if (JSON.stringify(token[i]).substring(0, 6) === '"quote' && token[i].length > 5) {

        quoted_indices.push([i + 1, JSON.stringify(token[i]).substring(6)]);

        token[i] = "quote";
      }
    }
    for (let i = 0; i < quoted_indices.length; i++) {
      if (i < 1) {
        token.splice(parseFloat(JSON.stringify(quoted_indices[i][0])), 0, (quoted_indices[i][1]).replace('"', ""));
      } else {
        token.splice(parseFloat(JSON.stringify(quoted_indices[i][0])) + 1, 0, (quoted_indices[i][1]).replace('"', ""));
      }
    }
    return token;
  };
  var print_objects = function (input) {
    if (input === undefined) {
      console.log(input);
    } else {
      console.log("[");
      for (let i = 0; i < input.length; i++) {
        if (input[i] instanceof Array) {
          print_objects(input[i]);
        } else {
          console.log("\t", input[i]);
        }
      }
      console.log("]");
    }
  }

  var parse = function (input) {
    var parsed = parenthesize(tokenize(input));
    // print_objects(parsed);
    new_parsed = []

    // update nested tree structure for quoted objects to be in its own list
    for (let i = 0; i < parsed.length; i++) {
      temp_list = []
      if (!(parsed[i] instanceof Array) && parsed[i].value === 'quote') {
        temp_list.push(parsed[i]);
        if (parsed[i + 1] instanceof Array) {
          for (let j = 0; j < parsed[i + 1].length; j++) {
            temp_list.push(parsed[i + 1][j]);
          }
        } else {
          temp_list.push(parsed[i + 1]);
        }
        i++;
        new_parsed.push(temp_list);
      } else {
        new_parsed.push(parsed[i]);
      }
    }

    return new_parsed;
  };

  var operators = {
    "+": function (numbers) {
      if (numbers.length > 0) {
        let sum = 0;
        for (var i = 0; i < numbers.length; i++) {
          if (numbers[i] instanceof Array) {
            for (var j = 0; j < numbers[i].length; j++) {

              let number_value = evaluate(numbers[i][j]);
              sum += parseFloat(number_value.value);
            }
          } else {
            let number_value = evaluate(numbers[i]);
            sum += parseFloat(number_value.value);

          }
        }
        return categorize(sum);
      } else {
        return NaN;
      }
    },
    "-": function (numbers) {
      try {
        if (numbers.length > 0) {
          if (numbers[0] instanceof Array) {
            let difference = (evaluate(numbers[0][0])).value;
            for (var j = 1; j < numbers[0].length; j++) {

              let number_value = evaluate(numbers[i][j]);
              difference -= parseFloat(number_value.value);
            }
            return categorize(difference);
          } else {
            let difference = (evaluate(numbers[0])).value;
            for (var i = 1; i < numbers.length; i++) {
              let number_value = evaluate(numbers[i]);
              difference -= parseFloat(number_value.value);
            }
            return categorize(difference);
          }
        } else {
          throw new NumArgsError();
        }
      } catch (err) {
        error.handle_errors(err);
      }
    },
    "*": function (numbers) {
      try {
        if (numbers.length > 0) {
          let product = 1;
          for (var i = 0; i < numbers.length; i++) {
            if (numbers[i] instanceof Array) {
              for (var j = 0; j < numbers[i].length; j++) {
                let number_value = evaluate(numbers[i][j]);
                if (number_value.value instanceof Object) {
                  product *= parseFloat(number_value.value.value);
                } else {
                  product *= parseFloat(number_value.value);
                }
              }
            } else {
              let number_value = evaluate(numbers[i]);
              if (number_value.value instanceof Object) {
                product *= parseFloat(number_value.value.value);
              } else {
                product *= parseFloat(number_value.value);
              }
            }
          }
          return categorize(product);
        } else {
          throw new NumArgsError();
        }
      } catch (err) {
        error.handle_errors(err);
      }
    },
    "/": function (numbers) {
      try {

        let top, bottom = 0;

        if (numbers.length > 0) {
          let max_numbers = 2;
          if (numbers.length > max_numbers) {
            throw new error.NumArgsError();
          } else if (numbers[0] instanceof Array) {
            if (numbers[0].length > max_numbers) {
              throw new error.NumArgsError();
            } else {
              top = numbers[0][0].value;
              bottom = numbers[0][1].value;
            }
          } else if (numbers.length == max_numbers) {
            top = numbers[0].value;
            bottom = numbers[1].value;
          } else {
            throw new error.InputError();
          }
        } else {
          throw new error.InputError();
        }

        if (bottom == 0) {
          throw new error.DivideZeroError();
        } else {
          let quotient = Math.floor(top / bottom);
          return categorize(quotient);
        }

      } catch (err) {
        return error.handle_errors(err);
      }
    },
    ">": function (numbers) {

      try {
        if (numbers.length > 0) {
          let max_numbers = 2;
          if (numbers.length > max_numbers) {
            throw new error.NumArgsError("too many arguments to greater than");
          } else if (numbers[0] instanceof Array) {
            if (numbers[0].length > max_numbers) {
              throw new error.NumArgsError("too many arguments to greater than");
            } else {
              let result = (numbers[0][0].value > numbers[0][1].value) ? "T" : "NIL";
              return categorize(result);
            }
          } else if (numbers.length == max_numbers) {
            let result = (numbers[0].value > numbers[1].value) ? "T" : "NIL";
            return categorize(result);
          } else {
            throw new error.InputError("error!");
          }
        } else {
          throw new error.InputError("error!");
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
    "<": function (numbers) {
      try {
        if (numbers.length > 0) {
          let max_numbers = 2;
          if (numbers.length > max_numbers) {
            throw new error.NumArgsError("too many arguments to less than");
          } else if (numbers[0] instanceof Array) {
            if (numbers[0].length > max_numbers) {
              throw new error.NumArgsError("too many arguments to less than");
            } else {
              let result = (numbers[0][0].value < numbers[0][1].value) ? "T" : "NIL";
              return categorize(result);
            }
          } else if (numbers.length == max_numbers) {
            let result = (numbers[0].value < numbers[1].value) ? "T" : "NIL";
            return categorize(result);
          } else {
            throw new error.InputError("error!");
          }
        } else {
          throw new error.InputError("error!");
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
    ">=": function (numbers) {
      try {
        if (numbers.length > 0) {
          let max_numbers = 2;
          if (numbers.length > max_numbers) {
            throw new error.NumArgsError("too many arguments to greater than or equal");
          } else if (numbers[0] instanceof Array) {
            if (numbers[0].length > max_numbers) {
              throw new error.NumArgsError("too many arguments to greater than or equal");
            } else {
              let result = (numbers[0][0].value >= numbers[0][1].value) ? "T" : "NIL";
              return categorize(result);
            }
          } else if (numbers.length == max_numbers) {
            let result = (numbers[0].value >= numbers[1].value) ? "T" : "NIL";
            return categorize(result);
          } else {
            throw new error.InputError("error!");
          }
        } else {
          throw new error.InputError("error!");
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
    "<=": function (numbers) {
      try {
        if (numbers.length > 0) {
          let max_numbers = 2;
          if (numbers.length > max_numbers) {
            throw new error.NumArgsError("too many arguments to less than or equal");
          } else if (numbers[0] instanceof Array) {
            if (numbers[0].length > max_numbers) {
              throw new error.NumArgsError("too many arguments to less than or equal");
            } else {
              let result = (numbers[0][0].value <= numbers[0][1].value) ? "T" : "NIL";
              return categorize(result);
            }
          } else if (numbers.length == max_numbers) {
            let result = (numbers[0].value <= numbers[1].value) ? "T" : "NIL";
            return categorize(result);
          } else {
            throw new error.InputError("error!");
          }
        } else {
          throw new error.InputError("error!");
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
    "=": function (numbers) {
      return operators["equal"](numbers);
    },
    "equal": function (numbers) {
      try {
        if (numbers.length > 0) {
          let max_numbers = 2;
          if (numbers.length > max_numbers) {
            throw new error.NumArgsError("too many arguments to equal");
          } else if (numbers[0] instanceof Array) {
            if (numbers[0].length > max_numbers) {
              throw new error.NumArgsError("too many arguments to equal");
            } else {
              let result = (numbers[0][0].value === numbers[0][1].value) ? "T" : "NIL";
              return categorize(result);
            }
          } else if (numbers.length == max_numbers) {
            let result = (numbers[0].value === numbers[1].value) ? "T" : "NIL";
            return categorize(result);
          } else {
            throw new error.InputError("error!");
          }
        } else {
          throw new error.NumArgsError();
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
    "/=": function (numbers) {
      try {
        if (numbers.length > 0) {
          let max_numbers = 2;
          if (numbers.length > max_numbers) {
            throw new error.NumArgsError("too many arguments to not equal");
          } else if (numbers[0] instanceof Array) {
            if (numbers[0].length > max_numbers) {
              throw new error.NumArgsError("too many arguments to not equal");
            } else {
              let result = (numbers[0][0].value !== numbers[0][1].value) ? "T" : "NIL";
              return categorize(result);
            }
          } else if (numbers.length == max_numbers) {
            let result = (numbers[0].value !== numbers[1].value) ? "T" : "NIL";
            return categorize(result);
          } else {
            throw new error.InputError();
          }
        } else {
          throw new error.NumArgsError();
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
  }

  var special = {
    "quote": function (input) {

      // only 1 element passed in with quote, do not return as a list
      if (input.length === 1) {
        return input[0];
      }
      // more than 1 element passed in with quote, return as list
      else {
        return input;
      }

    },
    "null": function (input) {
      if (input instanceof Array && input[0].length === 0) {
        return categorize("T");
      }
      let element = output(input);
      if ((element instanceof Array && element.length === 0) || element.value === "NIL" || element.value === "nil") {
        return categorize("T");
      } else {
        return categorize("NIL");
      }
    },
    "nil": function (input) {
      return special["null"](input);
    },
    "not": function (input) {
      return special["null"](input);
    },
    "if": function (input) {
      try {
        if (input.length !== 3) {
          throw new error.NumArgsError();
        } else {
          // ternary operator only evaluates the element based on the condition
          return ((output(input[0])).value === "T" ? output(input[1]) : output(input[2]));
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
    "and": function (input) {
      let eval_output, truth_output = undefined;

      // for each element, evaluate its truth
      // if any of the elements are NIL, return NIL
      // once we have gone through each element without returning NIL, return T
      for (let i = 0; i < input.length; i++) {
        eval_output = output(input[i]);
        truth_output = special["not"](eval_output);
        if (truth_output.value === "T") {
          return categorize("NIL");
        }
      }
      return eval_output;
    },
    "or": function (input) {
      let eval_output, truth_output = undefined;

      for (let i = 0; i < input.length; i++) {
        eval_output = output(input[i]);
        truth_output = special["not"](eval_output);
        if (truth_output.value === "NIL") {
          return eval_output;
        }
      }
      return categorize("NIL");
    },
    "eval": function (input) {
      return output(input);
    },
    "setq": function (input) {
      try {
        if (input[0].value === 'setq') {
          input = library.rest(input);
        }
        if (input.length % 2 === 0) {
          for (let i = 0; i < input.length; i += 2) {

            let variable = input[i];
            let variable_value = input[i + 1];

            if (variable.type !== "symbol") {
              throw new error.InputError("first argument must be a symbol - ");
            }

            let eval_output = (output(variable_value));
            if (!(eval_output instanceof Array)) {
              eval_output = categorize(eval_output.value);
            }

            let variable_object = {
              'type': variable.value,
              'value': eval_output
            }

            let already_declared = false;
            // check whether the variable has already been declared with a value
            for (let j = 0; j < global_var.scope.length; j++) {
              if (global_var.scope[j].type === variable.value) {
                already_declared = true;
                global_var.scope[j].value = eval_output;
              }
              already_declared = false;
            }

            if (!(already_declared)) {
              global_var.scope.push(variable_object);
            }

            if (i < input.length - 2) {
              continue;
            } else {
              return variable_object;
            }
          }
        } else {
          throw new error.NumArgsError("not enough arguments to setq - ");
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
    "defun": function (input) {

      try {
        if (input.length < 3) {
          throw new error.NumArgsError("Not enough arguments to defun - ");
        } else {

          let function_object = {
            'type': 'function',
            'name': input[0].value,
            'parameters': input[1],
            'body': input[2]
          };

          // see if there is already a function with the same name
          let function_output = global_functions.get_func(function_object.name);

          if (function_output === null) {
            global_functions.scope.push(function_object);
          }
          // if a function already exists with the same name, save new function
          else {
            for (let i = 0; i < global_functions.scope.length; i++) {
              if (global_functions.scope[i].name === function_object.name) {
                global_functions.scope[i] = function_object;
              }
            }
          }
          if (alpha.test(function_object.name)) {
            return function_object.name.toUpperCase();
          } else {
            return function_object.name;
          }

        }
      } catch (err) {
        return error.handle_errors(err);
      }
    }
  };

  var print_functions = {
    "print-space": function () {
      return " ";
    },
    "terpri": function (input) {
      try {
        if (input === 'undefined') {
          return " \n ";
        } else {
          throw new error.InputError();
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },
    "princ": function (input) {
      try {
        if (input.length < 1) {
          throw new error.NumArgsError("Too few arguments to princ - ");
        } else if (input.length > 1) {
          if (input[0].value === 'quote') {
            return (output(input));
          } else {
            throw new error.NumArgsError("Too many arguments to princ - ");
          }
        } else {
          return (output(input));
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    }
  };

  var list_operators = {

    "listp": function (input) {

      let out = output(input);

      if (out instanceof Array) {
        return categorize("T");
      } else {
        return categorize("NIL");
      }
    },

    "cons": function (input) {
      let out = undefined;
      let return_list = [];
      let quote_found = false;
      try {
        if (input.length > 2) {

          for (let i = 0; i < input.length; i++) {
            if (input[i].value === "quote") {
              quote_found = true;
            }
          }
          if (!quote_found) {
            throw new error.NumArgsError("Too many arguments to cons - ");
          }
        }

        if (input.length < 2) {
          throw new error.NumArgsError("Not enough arguments to cons - ");
        }

        // if the last element is not a list or nil, error!
        if (!(input[input.length - 1] instanceof Array) && !(input[input.length - 1].value === 'nil')) {
          throw new error.ListArgError("Second argument to cons is not a list - ");
        } else {

          // if second element is nil, the first element can either be 
          // a single atom or a quote + atom
          // both would mean the first element is in the final list
          if (input[input.length - 1].value === 'nil') {
            if (quote_found) {
              input[input.length - 2] = [input[input.length - 2]].unshift(input[input.length - 3]);
            }
            return_list.push(output(input[input.length - 2]));
          }
          // if the second element is a list, it is either an expression
          // or a quoted list
          else {

            // evaluate first element
            let first = output(input[input.length - 2]);
            if (first instanceof Array && first.length === 1) {
              return_list.push(first[0]);
            } else {
              return_list.push(first);
            }

            if (quote_found) {
              input[input.length - 1] = [input[input.length - 1]].unshift(input[input.length - 2]);
            }

            // evaluate second element 
            out = output(input[input.length - 1]);

            if (out.type === 'number') {
              throw new error.ListArgError("Second argument to cons is not a list - ");
            }

            // for a list we need to iterate and add each element
            for (let i = 0; i < out.length; i++) {
              if (out[i] !== undefined) {
                return_list.push(out[i]);
              }
            }
            // single element list just add it
            if ((out.length) == undefined) {
              return_list.push(out);
            }
          }
        }
        return return_list;

      } catch (err) {
        return error.handle_errors(err);
      }

    },

    "list": function (input) {
      let return_list = [];
      for (let i = 0; i < input.length; i++) {
        if (input[i] instanceof Array) {
          return_list.push(evaluateList(input[i]));
        } else {
          return_list.push(evaluate(input[i]));
        }
      }
      if (input.length === 1) {
        return_list.push(evaluate(input[i]));
      }
      return return_list;
    },

    "car": function (input) {
      try {
        if (input.length === 1 && (!(input[0] instanceof Array)) && input[0][0].value !== 'quote') {
          throw new error.ListArgError();
        } else {
          let return_list = evaluateList(input);
          if (return_list[0] instanceof Array) {
            return return_list[0][0];
          } else {
            return return_list[0];
          }
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    },

    "cdr": function (input) {
      try {
        if (!(input instanceof Array)) {
          throw new error.InputError();
        } else {
          let return_list = evaluateList(input);
          if (return_list[0] instanceof Array) {
            return_list[0].splice(0, 1)
            return return_list[0];
          } else {
            return_list.splice(0, 1);
            return return_list;
          }
        }
      } catch (err) {
        return error.handle_errors(err);
      }
    }

  }

  // main function that goes through each element in the input and
  // determines which function to call to evalute it
  var output = function (input) {

    try {

      if (input === undefined || input.length === undefined) {
        return evaluate(input);
      } else {
        // for empty input
        if (input === undefined) {
          // array is defined and has at least one element - ()
          if (input.length > 0) {
            return " ";
          }
        } else {

          for (var i = 0; i < input.length; i++) {

            if (input[0].type !== 'symbol' && input.length > 1) {
              throw new error.InputError("Unexpected head of list: " + (input[0]).value + " - ");
            }

            if (input[i] instanceof Array) {
              if (input[i][0].value === 'quote') {
                return evaluateList(input);
              } else {
                return evaluateList(input[i]);
              }
            } else {
              if (input[i].type === "symbol" && input.length !== 1) {
                let result = evaluateList(input);
                i += input.length;
                return result;
              } else {
                if (input[i].value === "quit" || input[i].value === "QUIT") {
                  return input[i].value;
                }
                return evaluate(input[i]);
              }
            }
          }
        }
      }
    } catch (err) {
      return error.handle_errors(err);
    }
  }

  // takes a single atom and evaluates its value
  var evaluate = function (atom) {
    try {
      if (atom.type === "number") {
        return atom;
      } else if (atom.value in print_functions) {
        return print_functions[atom.value];
      } else if (atom.type === "symbol" && alpha.test(atom.value)) {

        var_out = global_var.get_var(atom.value);

        if (var_out != null) {
          return var_out;
        } else {
          throw new error.UnboundSymbolError(atom.value);
        }
      } else {
        // for arithmetic operator given within parens and no arguments
        if (atom.value === "*") {
          return categorize("1");
        } else if (atom.value === "+") {
          return categorize("0")
        } else if (atom.value in operators) {
          throw new error.NumArgsError("No arguments given to operator - ");
        } else {
          if (alpha.test(atom.value) && atom.value !== undefined) {
            atom.value = (atom.value).toUpperCase();
          }
          return atom;
        }
      }
    } catch (err) {
      return error.handle_errors(err);
    }
  }

  // takes a list and goes through each element in the list to evaluate its value
  var evaluateList = function (list) {

    try {
      if (list[0] === []) {
        return '';
      }

      let list_context = new InnerContext();
      let temp_func = null;
      var add_to_scope = false;

      for (let i = 0; i < list.length; i++) {


        if (list[i].type === "symbol") {

          // for user-defined functions via defun
          temp_func = global_functions.get_func(list[i].value);
          if (temp_func !== null) {
            let func_arguments = library.rest(list);


            // test number of parameters
            if (func_arguments.length !== temp_func.parameters.length) {
              throw new error.NumArgsError("incorrect number of arguments given to " + temp_func.name);
            } else {
              // execute function body

              // call setq with function variables and the input arguments
              // sets as global variables
              for (let i = 0; i < temp_func.parameters.length; i++) {
                let temp_arg_list = [temp_func.parameters[i], func_arguments[i]];
                special["setq"](temp_arg_list);
              }
              list_context.scope.push(output(temp_func.body));
            }
          }

          // check if globally defined variable
          let temp_var = global_var.get_var(list[i].value);

          // check if corresponding function
          if (list[i].value in operators) {
            // if (i !== list.length - 1) {

            list_context.function_in_context = operators[list[i].value];
          } else if (list[i].value in special) {
            add_to_scope = false;
            return special[list[i].value](library.rest(list));
          } else if (list[i].value in list_operators) {
            return list_operators[list[i].value](library.rest(list));
          } else if (list[i].value in print_functions) {
            add_to_scope = true;
            return print_functions[list[i].value](library.rest(list));
          } else if (temp_var !== null) {
            list_context.scope.push(evaluate(temp_var.value));
          } else {
            if (temp_func === null) {
              throw new error.UnboundSymbolError(list[i].value);
            }
          }
        } else if (list[i] instanceof Array) {
          add_to_scope = true;
          list_context.scope.push(evaluateList(list[i]));
          add_to_scope = false;
        } else {
          list_context.scope.push(evaluate(list[i]));
        }
      }

      if (temp_func != null) {
        if (add_to_scope) {
          return list_context.scope;
        } else {
          return list_context.scope[0];
        }
      } else {
        if (list_context.function_in_context !== undefined) {
          let new_args = list_context.function_in_context(list_context.scope);
          return new_args;
        }
        return list_context.scope[0];
      }

    } catch (err) {
      return error.handle_errors(err);
    }
  }

  exports.klisp = {
    parse: parse,
    library: library,
    setup: setup,
    output: output
  };
})(typeof exports === 'undefined' ? this : exports);