import { MeshBuilder, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { IScript, visibleAsNumber, visibleAsString } from "babylonjs-editor-tools";

export default class TextBlockDrawer implements IScript {
	@visibleAsString("text")
	private readonly	_text:	string = "";
	@visibleAsNumber("font size", {
		min: 1,
		max: 300,
		step: 1
	})
	private readonly	_fontSize:	number = 24;
	@visibleAsNumber("texture size", {min: 2, max: 4096, step: 2})
	private readonly	_textureSize:	number = 2;

	private readonly	_plane:		Mesh;
	private readonly	_meshSize:	Vector3;

	public constructor(public mesh: Mesh) {
		this._meshSize = this.mesh.getBoundingInfo().boundingBox.extendSize;
		this._plane = MeshBuilder.CreatePlane(this.mesh.name + "_text", {width: this._meshSize.x * 2, height: this._meshSize.y * 2});
	}

	public	onStart():	void {
		this._plane.parent = this.mesh;
		this._plane.position.z = -this._meshSize.z - 0.1;
		var	widthScale:		number = 1;
		var	heightScale:	number = 1;
		if (this._meshSize.x > this._meshSize.y)
			heightScale = this._meshSize.y / this._meshSize.x;
		else
			widthScale = this._meshSize.x / this._meshSize.y;
		const	dynText:	AdvancedDynamicTexture = AdvancedDynamicTexture.CreateForMesh(this._plane, this._textureSize * widthScale, this._textureSize * heightScale);
		const	text:	TextBlock = new TextBlock(this.mesh.id + "_text", this._text);
		text.fontSize = this._fontSize;
		text.color = "white";
		dynText.addControl(text);
	}
}
