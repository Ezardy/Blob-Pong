import { IParticleSystem, Scene, Node } from "@babylonjs/core";
import { IScript } from "babylonjs-editor-tools";

export interface IClonableScript {
	clone(root: Node | IParticleSystem | Scene):	IScript;
}

export function	isclonablescript(obj: any):	obj is IClonableScript {
	return typeof obj?.clone === "function";
}
