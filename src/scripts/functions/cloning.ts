import { Nullable, Tags, TransformNode } from "@babylonjs/core";
import { getScriptByClassForObject } from "babylonjs-editor-tools";
import InputField3D from "../input-field";
import TextBlockDrawer from "../text-block";
import { Control3DClone } from "./typing-utils";
import { AdvancedStackPanel3D } from "../controls/advanced-stack-panel-3d";

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