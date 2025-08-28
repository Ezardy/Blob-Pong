import { IParticleSystem, Mesh, Nullable, Scene, Tags, TransformNode, Node } from "@babylonjs/core";
import { Control3D } from "@babylonjs/gui";
import { _applyScriptsForObject, getScriptByClassForObject, IScript, registerScriptInstance } from "babylonjs-editor-tools";
import { Control3DClone } from "./typing-utils";
import { AdvancedStackPanel3D } from "./advanced-stack-panel-3d";
import TextBlockDrawer from "./text-block";
import InputField3D from "./input-field";

export interface IClonableControl3D {
	clone():	Control3DClone;
}

export interface IClonableScript {
	clone(root: Node | IParticleSystem | Scene):	IScript;
}

export function	implementsIClonableControl3D(obj: Control3D):	obj is Control3D & IClonableControl3D {
	return typeof (obj as any).clone === "function";
}

export function	cloneNodeWithScripts(node: TransformNode):	Nullable<TransformNode> {
	return node.instantiateHierarchy(
		null,
		{doNotInstantiate: (n: TransformNode) => Tags.MatchesQuery(n, "noInstance") || Tags.MatchesQuery(n, "noClone")},
		(s: TransformNode, c: TransformNode) => {
			if (Tags.MatchesQuery(s, "noClone"))
				c.dispose();
			else {
				const	text:	TextBlockDrawer | null = getScriptByClassForObject(s, TextBlockDrawer);
				if (text)
					text.clone(c)
				const	field:	InputField3D | null = getScriptByClassForObject(s, InputField3D);
				if (field)
					field.clone(c);
			}
		}
	);
}

export function	parentClones(clones: Control3DClone):	void {
	if (clones.root instanceof AdvancedStackPanel3D) {
		clones.root.blockLayout = true;
		for (const child of clones.children) {
			clones.root.addControl(child.root);
			parentClones(child);
		}
		clones.root.blockLayout = false;
	}
}