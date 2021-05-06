/*tslint:disable:no-console*/

import readline = require("readline");
import { Cli } from "./cli";

const cli = new Cli();

const rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt(`${cli.Prompt}> `);
rl.prompt();
rl.on("line", (line: string) => {
  rl.setPrompt(`${cli.Prompt}> `);
  const result = cli.Execute(line);
  if (result.exit) rl.close();
  else if (result.output !== "") console.log(result.output);
  rl.setPrompt(`${cli.Prompt}> `);
  rl.prompt();
}).on("close", () => {
  process.exit(0);
});
