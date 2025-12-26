import { Nullable, Tags, Tools, TransformNode } from "@babylonjs/core";
import { IRegisteredScript, IScript, scriptsDictionary } from "babylonjs-editor-tools";
import { Control3DClone } from "./typing-utils";
import { AdvancedStackPanel3D } from "../controls/advanced-stack-panel-3d";
import { isclonablescript } from "../interfaces/iclonablescript";

export function	cloneNodeWithScripts(node: TransformNode):	Nullable<TransformNode> {
	const	registeredScripts:	Map<TransformNode, IRegisteredScript[]> = new Map<TransformNode, IRegisteredScript[]>();
	const	result:	Nullable<TransformNode> = node.instantiateHierarchy(
		null,
		{doNotInstantiate: (n: TransformNode) => Tags.MatchesQuery(n, "noInstance") || Tags.MatchesQuery(n, "noClone")},
		(s: TransformNode, c: TransformNode) => {
			if (Tags.MatchesQuery(s, "noClone"))
				c.dispose();
			else {
				const	scripts:	IRegisteredScript[] | undefined = scriptsDictionary.get(s);
				if (scripts)
					registeredScripts.set(c, scripts);
			}
		}
	);
	for (const pair of registeredScripts) {
		for (const script of pair[1]) {
			const	inst:	IScript = script.instance;
			if (isclonablescript(inst))
				inst.clone(pair[0]);
		}
	}
	return result;
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