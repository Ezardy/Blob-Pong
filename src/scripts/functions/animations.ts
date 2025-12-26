import { int, Animation } from "@babylonjs/core";

export function	setKeys(anim: Animation, start: any, end: any, time: int) {
	anim.setKeys([{
		frame: 0,
		value: start
	}, {
		frame: time,
		value: end
	}]);
}