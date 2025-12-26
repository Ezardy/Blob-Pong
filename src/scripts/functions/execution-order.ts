import { int, Tools } from "@babylonjs/core";

export function	executeOnStage(func: () => void, stage: int):	void {
	if (stage)
		Tools.SetImmediate(() => executeOnStage(func, stage - 1));
	else
		func();
}