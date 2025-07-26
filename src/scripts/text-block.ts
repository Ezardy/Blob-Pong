import { MeshBuilder, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { visibleAsNumber, visibleAsString } from "babylonjs-editor-tools";

export default class TextBlockDrawer {
	@visibleAsString("text")
	private readonly	_text:	string = "";
	@visibleAsNumber("font size", {
		min: 1,
		max: 300,
		step: 1
	})
	private readonly	_fontSize:	number = 24;

	public constructor(public mesh: Mesh) { }

	public	onStart():	void {
		const	buttonSize:	Vector3 = this.mesh.getBoundingInfo().boundingBox.extendSize.scale(2);
		const	textBlock:	Mesh = MeshBuilder.CreatePlane(this.mesh.name + "_text", {width: buttonSize.x, height: buttonSize.y});
		textBlock.parent = this.mesh;
		textBlock.position.z = -buttonSize.z / 2 - 0.1;
		var	widthScale:		number = 1;
		var	heightScale:	number = 1;
		if (buttonSize.x > buttonSize.y)
			heightScale = buttonSize.y / buttonSize.x;
		else
			widthScale = buttonSize.x / buttonSize.y;
		const	dynText:	AdvancedDynamicTexture = AdvancedDynamicTexture.CreateForMesh(textBlock, 1024 * widthScale, 1024 * heightScale);
		const	text:	TextBlock = new TextBlock(this.mesh.id + "_text", this._text);
		text.fontSize = this._fontSize;
		text.color = "white";
		dynText.addControl(text);
	}
}
