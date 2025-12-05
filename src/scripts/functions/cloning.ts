import { Nullable, Tags, TransformNode } from "@babylonjs/core";
import { IRegisteredScript, scriptsDictionary } from "babylonjs-editor-tools";
import { Control3DClone } from "./typing-utils";
import { AdvancedStackPanel3D } from "../controls/advanced-stack-panel-3d";
import { isclonablescript } from "../interfaces/iclonablescript";

export function	cloneNodeWithScripts(node: TransformNode):	Nullable<TransformNode> {
	return node.instantiateHierarchy(
		null,
		{doNotInstantiate: (n: TransformNode) => Tags.MatchesQuery(n, "noInstance") || Tags.MatchesQuery(n, "noClone")},
		(s: TransformNode, c: TransformNode) => {
			if (Tags.MatchesQuery(s, "noClone"))
				c.dispose();
			else {
				const	scripts:	IRegisteredScript[] | undefined = scriptsDictionary.get(s);
				if (scripts) {
					for (const script of scripts) {
						if (isclonablescript(script.instance))
							script.instance.clone(c);
					}
				}
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