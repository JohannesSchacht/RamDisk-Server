/*tslint:disable:no-console*/

import readline = require("readline");
import { Shell } from "./shell";

const shell = new Shell();

const rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt(`${shell.Prompt}> `);
rl.prompt();
rl.on("line", (line: string) => {
  rl.setPrompt(`${shell.Prompt}> `);
  const result = shell.Execute(line);
  if (result.exit) rl.close();
  else if (result.output !== "") console.log(result.output);
  rl.setPrompt(`${shell.Prompt}> `);
  rl.prompt();
}).on("close", () => {
  process.exit(0);
});
