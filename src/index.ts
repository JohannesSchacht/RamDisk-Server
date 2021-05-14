/*tslint:disable:no-console*/

import readline = require("readline");
import { Shell, analyseCommand, Command } from "./shell";
import { Observable, of } from "rxjs";
import { map, catchError, tap, takeUntil } from "rxjs/operators";
import * as su from "./utilities";

const shell = new Shell();

const observable = new Observable((subscriber) => {
	const rl = readline.createInterface(process.stdin, process.stdout);
	rl.setPrompt(`${shell.prompt}> `);
	rl.prompt();
	rl.on("line", (line: string) => {
		subscriber.next(line);
		if (shell.exit) {
			subscriber.complete();
			rl.close();
		}
		rl.setPrompt(`${shell.prompt}> `);
		rl.prompt();
	}).on("close", () => {
		process.exit(0);
	});
}).pipe(
	map((x) => x as string), // why is this needed?
	map((x) => su.tokenize(x)),
	map((x) => analyseCommand(x)),
	map((x) => resultOutput(shell.execute(x))),
	catchError((e) => of(e.message).pipe(map((x) => console.log(x))))
);
observable.subscribe();

function resultOutput(line: string) {
	if (line !== "") console.log(line);
}
