import { Color4, MeshBuilder, Vector2, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { IScript, visibleAsBoolean, visibleAsColor4, visibleAsNumber, visibleAsString, visibleAsVector2 } from "babylonjs-editor-tools";

export default class TextBlockDrawer implements IScript {
	@visibleAsString("front text")
	private 			_frontText:	string = "";
	@visibleAsNumber("front font size", {min: 1, max: 300, step: 1})
	private readonly	_frontFontSize:	number = 24;
	@visibleAsColor4("front text color")
	private readonly	_frontColor:	Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("front positive paddings", {min: 0, step: 1})
	private readonly	_frontPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("front negative paddings", {min: 0, step: 1})
	private readonly	_frontNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("front alignments", {min: 0, max: 2, step: 1})
	private readonly	_frontAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("front font family")
	private readonly	_frontFontFamily:	string = "";
	@visibleAsNumber("front text angle", {min: 0, max: 270, step: 90})
	private				_frontAngle:	number = 0;
	@visibleAsBoolean("invert front text horizontally")
	private readonly	_isFrontInverted:	boolean = false;
	private readonly	_frontTextBlock:	TextBlock;
	private readonly	_frontPlane:		Mesh;

	@visibleAsString("back text")
	private 			_backText:	string = "";
	@visibleAsNumber("back font size", {min: 1, max: 300, step: 1})
	private readonly	_backFontSize:	number = 24;
	@visibleAsColor4("back text color")
	private readonly	_backColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("back positive paddings", {min: 0, step: 1})
	private readonly	_backPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("back negative paddings", {min: 0, step: 1})
	private readonly	_backNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("back alignments", {min: 0, max: 2, step: 1})
	private readonly	_backAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("front font family")
	private readonly	_backFontFamily:	string = "";
	@visibleAsNumber("back text angle", {min: 0, max: 270, step: 90})
	private				_backAngle:		number = 0;
	@visibleAsBoolean("invert back text horizontally")
	private readonly	_isBackInverted:	boolean = false;
	private readonly	_backTextBlock:		TextBlock;
	private readonly	_backPlane:			Mesh;

	@visibleAsString("right text")
	private 			_rightText:	string = "";
	@visibleAsNumber("right font size", {min: 1, max: 300, step: 1})
	private readonly	_rightFontSize:	number = 24;
	@visibleAsColor4("right text color")
	private readonly	_rightColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("right positive paddings", {min: 0, step: 1})
	private readonly	_rightPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("right negative paddings", {min: 0, step: 1})
	private readonly	_rightNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("right alignments", {min: 0, max: 2, step: 1})
	private readonly	_rightAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("right font family")
	private readonly	_rightFontFamily:	string = "";
	@visibleAsNumber("right text angle", {min: 0, max: 270, step: 90})
	private				_rightAngle:		number = 0;
	@visibleAsBoolean("invert right text horizontally")
	private readonly	_isRightInverted:	boolean = false;
	private readonly	_rightTextBlock:	TextBlock;
	private readonly	_rightPlane:		Mesh;

	@visibleAsString("left text")
	private 			_leftText:	string = "";
	@visibleAsNumber("left font size", {min: 1, max: 300, step: 1})
	private readonly	_leftFontSize:	number = 24;
	@visibleAsColor4("left text color")
	private readonly	_leftColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("left positive paddings", {min: 0, step: 1})
	private readonly	_leftPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("left negative paddings", {min: 0, step: 1})
	private readonly	_leftNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("left alignments", {min: 0, max: 2, step: 1})
	private readonly	_leftAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("left font family")
	private readonly	_leftFontFamily:	string = "";
	@visibleAsNumber("left text angle", {min: 0, max: 270, step: 90})
	private				_leftAngle:		number = 0;
	@visibleAsBoolean("invert left text horizontally")
	private readonly	_isLeftInverted:	boolean = false;
	private readonly	_leftTextBlock:	TextBlock;
	private readonly	_leftPlane:		Mesh;

	@visibleAsString("top text")
	private 			_topText:	string = "";
	@visibleAsNumber("top font size", {min: 1, max: 300, step: 1})
	private readonly	_topFontSize:	number = 24;
	@visibleAsColor4("top text color")
	private readonly	_topColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("top positive paddings", {min: 0, step: 1})
	private readonly	_topPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("top negative paddings", {min: 0, step: 1})
	private readonly	_topNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("top alignments", {min: 0, max: 2, step: 1})
	private readonly	_topAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("top font family")
	private readonly	_topFontFamily:	string = "";
	@visibleAsNumber("top text angle", {min: 0, max: 270, step: 90})
	private				_topAngle:		number = 0;
	@visibleAsBoolean("invert top text horizontally")
	private readonly	_isTopInverted:	boolean = false;
	private readonly	_topTextBlock:	TextBlock;
	private readonly	_topPlane:		Mesh;

	@visibleAsString("bottom text")
	private 			_bottomText:	string = "";
	@visibleAsNumber("bottom font size", {min: 1, max: 300, step: 1})
	private readonly	_bottomFontSize:	number = 24;
	@visibleAsColor4("bottom text color")
	private readonly	_bottomColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("bottom positive paddings", {min: 0, step: 1})
	private readonly	_bottomPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("bottom negative paddings", {min: 0, step: 1})
	private readonly	_bottomNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("bottom alignments", {min: 0, max: 2, step: 1})
	private readonly	_bottomAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("bottom font family")
	private readonly	_bottomFontFamily:	string = "";
	@visibleAsNumber("bottom text angle", {min: 0, max: 270, step: 90})
	private				_bottomAngle:		number = 0;
	@visibleAsBoolean("invert bottom text horizontally")
	private readonly	_isBottomInverted:	boolean = false;
	private readonly	_bottomTextBlock:	TextBlock;
	private readonly	_bottomPlane:		Mesh;

	private readonly	_extendSize:		Vector3;
	private readonly	_extendSizeScaled:	Vector3;
	private				_drew:				boolean = false;

	public constructor(public mesh: Mesh) {
		this._extendSize = this.mesh.getBoundingInfo().boundingBox.extendSize;
		this._extendSizeScaled = this._extendSize.multiply(mesh.absoluteScaling);

		this._frontTextBlock = new TextBlock(this.mesh.id + "_front_text");
		this._frontPlane = MeshBuilder.CreatePlane(this.mesh.name + "_front_text", {width: this._extendSize.x * 2, height: this._extendSize.y * 2});
		this._frontPlane.parent = this.mesh;

		this._backTextBlock = new TextBlock(this.mesh.id + "_back_text");
		this._backPlane = MeshBuilder.CreatePlane(this.mesh.name + "_back_text", {width: this._extendSize.x * 2, height: this._extendSize.y * 2});
		this._backPlane.parent = this.mesh;

		this._rightTextBlock = new TextBlock(this.mesh.id + "_right_text");
		this._rightPlane = MeshBuilder.CreatePlane(this.mesh.name + "_right_text", {width: this._extendSize.z * 2, height: this._extendSize.y * 2});
		this._rightPlane.parent = this.mesh;

		this._leftTextBlock = new TextBlock(this.mesh.id + "_left_text");
		this._leftPlane = MeshBuilder.CreatePlane(this.mesh.name + "_left_text", {width: this._extendSize.z * 2, height: this._extendSize.y * 2});
		this._leftPlane.parent = this.mesh;

		this._topTextBlock = new TextBlock(this.mesh.id + "_top_text");
		this._topPlane = MeshBuilder.CreatePlane(this.mesh.name + "_top_text", {width: this._extendSize.x * 2, height: this._extendSize.z * 2});
		this._topPlane.parent = this.mesh;

		this._bottomTextBlock = new TextBlock(this.mesh.id + "_bottom_text");
		this._bottomPlane = MeshBuilder.CreatePlane(this.mesh.name + "_bottom_text", {width: this._extendSize.x * 2, height: this._extendSize.z * 2});
		this._bottomPlane.parent = this.mesh;
	}

	public	onStart():	void {
		this.draw();
	}

	public	draw():	void {
		if (!this._drew) {
			this._frontText = JSON.parse(`"${this._frontText}"`);
			this._backText = JSON.parse(`"${this._backText}"`);
			this._leftText = JSON.parse(`"${this._leftText}"`);
			this._rightText = JSON.parse(`"${this._rightText}"`);
			this._topText = JSON.parse(`"${this._topText}"`);
			this._bottomText = JSON.parse(`"${this._bottomText}"`);
			this._frontAngle *= Math.PI / 180;
			this._backAngle *= Math.PI / 180;
			this._topAngle *= -Math.PI / 180;
			this._bottomAngle *= Math.PI / 180;
			this._leftAngle *= Math.PI / 180;
			this._rightAngle *= Math.PI / 180;
			const	whXY:	Vector2 = new Vector2(this._extendSizeScaled.x, this._extendSizeScaled.y);
			const	whZY:	Vector2 = new Vector2(this._extendSizeScaled.z, this._extendSizeScaled.y);
			const	whXZ:	Vector2 = new Vector2(this._extendSizeScaled.x, this._extendSizeScaled.z);
			this._renderText(this._frontText, this._frontFontSize, this._frontColor, this._frontPositivePaddings, this._frontNegativePaddings, this._frontAlignments, this._frontFontFamily, this._frontTextBlock, this._frontPlane, new Vector3(0, 0, -this._extendSize.z), new Vector3(0, this._isFrontInverted ? Math.PI : 0, this._frontAngle), whXY.rotate(this._frontAngle));
			this._renderText(this._backText, this._backFontSize, this._backColor, this._backPositivePaddings, this._backNegativePaddings, this._backAlignments, this._backFontFamily, this._backTextBlock, this._backPlane, new Vector3(0, 0, this._extendSize.z), new Vector3(0, this._isBackInverted ? 0 : Math.PI, this._backAngle), whXY.rotate(this._backAngle));
			this._renderText(this._rightText, this._rightFontSize, this._rightColor, this._rightPositivePaddings, this._rightNegativePaddings, this._rightAlignments, this._rightFontFamily, this._rightTextBlock, this._rightPlane, new Vector3(this._extendSize.x, 0, 0), new Vector3(0, this._isRightInverted ? Math.PI / 2 : -Math.PI / 2, this._rightAngle), whZY.rotate(this._rightAngle));
			this._renderText(this._leftText, this._leftFontSize, this._leftColor, this._leftPositivePaddings, this._leftNegativePaddings, this._leftAlignments, this._leftFontFamily, this._leftTextBlock, this._leftPlane, new Vector3(-this._extendSize.x, 0, 0), new Vector3(0, this._isLeftInverted ? -Math.PI / 2 : Math.PI / 2, this._leftAngle), whZY.rotate(this._leftAngle));
			this._renderText(this._topText, this._topFontSize, this._topColor, this._topPositivePaddings, this._topNegativePaddings, this._topAlignments, this._topFontFamily, this._topTextBlock, this._topPlane, new Vector3(0, this._extendSize.y, 0), new Vector3(this._isTopInverted ? -Math.PI / 2 : Math.PI / 2, this._topAngle, 0), whXZ.rotate(this._topAngle));
			this._renderText(this._bottomText, this._bottomFontSize, this._bottomColor, this._bottomPositivePaddings, this._bottomNegativePaddings, this._bottomAlignments, this._bottomFontFamily, this._bottomTextBlock, this._bottomPlane, new Vector3(0, -this._extendSize.y, 0), new Vector3(this._isBottomInverted ? Math.PI / 2 : -Math.PI / 2, this._bottomAngle, 0), whXZ.rotate(this._bottomAngle));
			this._drew = true;
		}
	}

	private	_renderText(text: string, fontSize: number, color: Color4, posPad: Vector2, negPad: Vector2, alignments: Vector2, family: string, textBlock: TextBlock, plane: Mesh, offset: Vector3, rotation: Vector3, widthHeight: Vector2):	void {
		if (text.length > 0) {
			plane.position = offset.addInPlace(offset.normalizeToNew().scaleInPlace(0.04));
			plane.addRotation(rotation.x, rotation.y, rotation.z);
			textBlock.text = text;
			switch (alignments.x) {
				case 0:
					textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
					break;
				case 1:
					textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
					break;
				default:
					textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
					break;
			}
			switch (alignments.y) {
				case 0:
					textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
					break;
				case 1:
					textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
					break;
				default:
					textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
					break;
			}
			textBlock.setPadding(posPad.y, posPad.x, negPad.y, negPad.x);
			textBlock.fontFamily = family;
			textBlock.fontSize = fontSize;
			textBlock.color = color.toHexString();
			const	dynText:	AdvancedDynamicTexture = AdvancedDynamicTexture.CreateForMesh(plane, Math.abs(widthHeight.x) * 2, Math.abs(widthHeight.y) * 2);
			dynText.addControl(textBlock);
		} else
			plane.setEnabled(false);
	}
}
