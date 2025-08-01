import { Color3, Color4, MeshBuilder, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { IScript, visibleAsColor4, visibleAsNumber, visibleAsString } from "babylonjs-editor-tools";

export default class TextBlockDrawer implements IScript {
	@visibleAsString("front text")
	private readonly	_frontText:	string = "";
	@visibleAsNumber("front font size", {min: 1, max: 300, step: 1})
	private readonly	_frontFontSize:	number = 24;
	@visibleAsColor4("front text color")
	private readonly	_frontColor:		Color4 = new Color4(1, 1, 1, 1);
	private readonly	_frontTextBlock:	TextBlock;
	private readonly	_frontPlane:		Mesh;

	@visibleAsString("back text")
	private readonly	_backText:	string = "";
	@visibleAsNumber("back font size", {min: 1, max: 300, step: 1})
	private readonly	_backFontSize:	number = 24;
	@visibleAsColor4("back text color")
	private readonly	_backColor:		Color4 = new Color4(1, 1, 1, 1);
	private readonly	_backTextBlock:	TextBlock;
	private readonly	_backPlane:		Mesh;

	@visibleAsString("right text")
	private readonly	_rightText:	string = "";
	@visibleAsNumber("right font size", {min: 1, max: 300, step: 1})
	private readonly	_rightFontSize:	number = 24;
	@visibleAsColor4("right text color")
	private readonly	_rightColor:		Color4 = new Color4(1, 1, 1, 1);
	private readonly	_rightTextBlock:	TextBlock;
	private readonly	_rightPlane:		Mesh;

	@visibleAsString("left text")
	private readonly	_leftText:	string = "";
	@visibleAsNumber("left font size", {min: 1, max: 300, step: 1})
	private readonly	_leftFontSize:	number = 24;
	@visibleAsColor4("left text color")
	private readonly	_leftColor:		Color4 = new Color4(1, 1, 1, 1);
	private readonly	_leftTextBlock:	TextBlock;
	private readonly	_leftPlane:		Mesh;

	@visibleAsString("top text")
	private readonly	_topText:	string = "";
	@visibleAsNumber("top font size", {min: 1, max: 300, step: 1})
	private readonly	_topFontSize:	number = 24;
	@visibleAsColor4("top text color")
	private readonly	_topColor:		Color4 = new Color4(1, 1, 1, 1);
	private readonly	_topTextBlock:	TextBlock;
	private readonly	_topPlane:		Mesh;

	@visibleAsString("bottom text")
	private readonly	_bottomText:	string = "";
	@visibleAsNumber("bottom font size", {min: 1, max: 300, step: 1})
	private readonly	_bottomFontSize:	number = 24;
	@visibleAsColor4("bottom text color")
	private readonly	_bottomColor:		Color4 = new Color4(1, 1, 1, 1);
	private readonly	_bottomTextBlock:	TextBlock;
	private readonly	_bottomPlane:		Mesh;

	private readonly	_meshSize:	Vector3;

	public constructor(public mesh: Mesh) {
		const	extendSize:	Vector3 = this.mesh.getBoundingInfo().boundingBox.extendSize;
		this._meshSize = new Vector3(extendSize.x * this.mesh.absoluteScaling.x, extendSize.y * this.mesh.absoluteScaling.y, extendSize.z * this.mesh.absoluteScaling.z);

		this._frontTextBlock = new TextBlock(this.mesh.id + "_front_text");
		this._frontPlane = MeshBuilder.CreatePlane(this.mesh.name + "_front_text", {width: this._meshSize.x * 2, height: this._meshSize.y * 2});
		this._frontPlane.parent = this.mesh;

		this._backTextBlock = new TextBlock(this.mesh.id + "_back_text");
		this._backPlane = MeshBuilder.CreatePlane(this.mesh.name + "_back_text", {width: this._meshSize.x * 2, height: this._meshSize.y * 2});
		this._backPlane.parent = this.mesh;

		this._rightTextBlock = new TextBlock(this.mesh.id + "_right_text");
		this._rightPlane = MeshBuilder.CreatePlane(this.mesh.name + "_right_text", {width: this._meshSize.z * 2, height: this._meshSize.y * 2});
		this._rightPlane.parent = this.mesh;

		this._leftTextBlock = new TextBlock(this.mesh.id + "_left_text");
		this._leftPlane = MeshBuilder.CreatePlane(this.mesh.name + "_left_text", {width: this._meshSize.z * 2, height: this._meshSize.y * 2});
		this._leftPlane.parent = this.mesh;

		this._topTextBlock = new TextBlock(this.mesh.id + "_top_text");
		this._topPlane = MeshBuilder.CreatePlane(this.mesh.name + "_top_text", {width: this._meshSize.x * 2, height: this._meshSize.z * 2});
		this._topPlane.parent = this.mesh;

		this._bottomTextBlock = new TextBlock(this.mesh.id + "_bottom_text");
		this._bottomPlane = MeshBuilder.CreatePlane(this.mesh.name + "_bottom_text", {width: this._meshSize.x * 2, height: this._meshSize.z * 2});
		this._bottomPlane.parent = this.mesh;
	}

	public	onStart():	void {
		this._renderText(this._frontText, this._frontFontSize, this._frontColor, this._frontTextBlock, this._frontPlane, new Vector3(0, 0, -this._meshSize.z), new Vector3(0, 0, 0), this._meshSize.x, this._meshSize.y);
		this._renderText(this._backText, this._backFontSize, this._backColor, this._backTextBlock, this._backPlane, new Vector3(0, 0, this._meshSize.z), new Vector3(0, Math.PI, 0), this._meshSize.x, this._meshSize.y);
		this._renderText(this._rightText, this._rightFontSize, this._rightColor, this._rightTextBlock, this._rightPlane, new Vector3(this._meshSize.x, 0, 0), new Vector3(0, -Math.PI / 2, 0), this._meshSize.z, this._meshSize.y);
		this._renderText(this._leftText, this._leftFontSize, this._leftColor, this._leftTextBlock, this._leftPlane, new Vector3(-this._meshSize.x, 0, 0), new Vector3(0, Math.PI / 2, 0), this._meshSize.z, this._meshSize.y);
		this._renderText(this._topText, this._topFontSize, this._topColor, this._topTextBlock, this._topPlane, new Vector3(0, this._meshSize.y, 0), new Vector3(Math.PI / 2, 0, 0), this._meshSize.x, this._meshSize.z);
		this._renderText(this._bottomText, this._bottomFontSize, this._bottomColor, this._bottomTextBlock, this._bottomPlane, new Vector3(0, -this._meshSize.y, 0), new Vector3(-Math.PI / 2, 0, 0), this._meshSize.x, this._meshSize.z);
	}

	private	_renderText(text: string, fontSize: number, color: Color4, textBlock: TextBlock, plane: Mesh, offset: Vector3, rotation: Vector3, width: number, height: number):	void {
		if (text.length > 0) {
			plane.position = plane.position.add(offset.addInPlace(offset.normalizeToNew().scaleInPlace(0.1)));
			if (rotation.isNonUniform)
				plane.rotate(rotation, rotation.length());
			textBlock.text = text;
			textBlock.fontSize = fontSize;
			textBlock.color = color.toHexString();
			const	dynText:	AdvancedDynamicTexture = AdvancedDynamicTexture.CreateForMesh(plane, width * 2, height * 2);
			dynText.addControl(textBlock);
		} else
			plane.setEnabled(false);
	}
}
