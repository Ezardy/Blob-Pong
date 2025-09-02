import { Control3D } from "@babylonjs/gui";
import { Control3DClone } from "../functions/typing-utils";

export interface IClonableControl3D {
	clone():	Control3DClone;
}

export function	isclonablecontrol3d(obj: Control3D):	obj is Control3D & IClonableControl3D {
	return typeof (obj as any).clone === "function";
}
