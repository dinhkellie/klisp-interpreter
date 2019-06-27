var error = function () {
    return "error! ";
}

var unbound_symbol = function () {
    return " is an unbound symbol";
}

var number_error = function () {
    return " is not a number";
}

var num_args_error = function () {
    return "incorrect number of arguments";
}

var unknown_error = function () {
    return "input error";
}

var divide_zero = function () {
    return "Divide by zero";
}

var list_argument = function () {
    return "Argument should be a list. ";
}

var has_message = function (err) {
    return (err.message !== "");
}

var handle_errors = function (err) {

    var error_message = "";
    error_message += error();

    if (has_message(err)) {
        error_message += err.message;
    }
    switch (err.name) {
        case 'InputError':
            error_message += unknown_error();
            break;
        case 'NumArgsError':
            error_message += num_args_error();
            break;
        case 'DivideZeroError':
            error_message += divide_zero();
            break;
        case 'ListArgError':
            error_message += list_argument();
            break;
        case 'NumberError':
            error_message += number_error();
            break;
        case 'UnboundSymbolError':
            error_message += unbound_symbol();
            break;
    }
    return error_message;

}

class NumberError extends Error {
    constructor(message = "") {
        super(message);
        this.name = 'NumberError';
        this.message = message;
    }
}

class InputError extends Error {
    constructor(message = "") {
        super(message);
        this.name = 'InputError';
        this.message = message;
    }
}

class NumArgsError extends Error {
    constructor(message = "") {
        super(message);
        this.name = 'NumArgsError';
        this.message = message;
    }
}

class DivideZeroError extends Error {
    constructor(message = "") {
        super(message);
        this.name = 'DivideZeroError';
        this.message = message;
    }
}

class ListArgError extends Error {
    constructor(message = "") {
        super(message);
        this.name = 'ListArgError';
        this.message = message;
    }
}

class UnboundSymbolError extends Error {
    constructor(message = "") {
        super(message);
        this.name = 'UnboundSymbolError';
        this.message = message;
    }
}

class UnboundFunctionError extends Error {
    constructor(message = "") {
        super(message);
        this.name = 'UnboundFunctionError';
        this.message = message;
    }
}

module.exports = {
    NumberError,
    InputError,
    NumArgsError,
    DivideZeroError,
    ListArgError,
    UnboundSymbolError,
    UnboundFunctionError,
    handle_errors
}