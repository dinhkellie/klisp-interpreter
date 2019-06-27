var readline = require("readline");
var fs = require('fs');
var klisp = require("./klisp").klisp;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ">> "
});

var fileReader = function (input) {
  console.log("Loading file " + input.substring(7, input.length-1) + "...");
  // read file into an array containing each line
  var lines = fs.readFileSync(input.substring(7, input.length-1), "utf8").split('\n');
  console.log("Loaded file " + input.substring(7, input.length-1));

  // iterate through each line and evaluate it
  for (let i = 0; i < lines.length; i++) {
    let out = klisp.output(klisp.parse(lines[i]));
    handle_output(rl, out);
  }

  // if evaluating each line is successful, return T
  return "T";
};

var handle_output = function (rl, out) {
  if (out === "quit" || out === "QUIT") {
    rl.close();
  } else {
    console.log(klisp.library.print(out, output = ""));
  }
}

rl.prompt();

rl.on("line", (input) => {
  klisp.setup();
  switch(input.trim()) {
    default:

      if (input === "()") {
        console.log("NIL");
        break;
      }

      let out = undefined;

      if (input.substring(1, 5) === 'load') {
        out = fileReader(input);
      } else {
        out = klisp.output(klisp.parse(input));
      }
      handle_output(rl, out);
  }
  rl.prompt();
});
rl.on("close", function() {
  process.exit(0);
});