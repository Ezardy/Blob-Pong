import { Color4, IParticleSystem, MeshBuilder, Scene, Tags, Vector2, Vector3, Node, InstancedMesh } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { getScriptByClassForObject, IScript, registerScriptInstance, visibleAsBoolean, visibleAsColor4, visibleAsNumber, visibleAsString, visibleAsVector2 } from "babylonjs-editor-tools";
import { IClonableScript } from "./clonning";

export default class TextBlockDrawer implements IScript, IClonableScript {
	@visibleAsString("front text")
	private	_frontText:	string = "";
	@visibleAsNumber("front font size", {min: 1, max: 300, step: 1})
	private	_frontFontSize:	number = 24;
	@visibleAsColor4("front text color")
	private	_frontColor:	Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("front positive paddings", {min: 0, step: 1})
	private	_frontPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("front negative paddings", {min: 0, step: 1})
	private	_frontNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("front alignments", {min: 0, max: 2, step: 1})
	private	_frontAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("front font family")
	private	_frontFontFamily:	string = "";
	@visibleAsNumber("front text angle", {min: 0, max: 270, step: 90})
	private	_frontAngle:	number = 0;
	@visibleAsBoolean("invert front text horizontally")
	private				_isFrontInverted:	boolean = false;
	private readonly	_frontPlane:		Mesh;
	public readonly		frontTextBlock:		TextBlock;

	@visibleAsString("back text")
	private 			_backText:	string = "";
	@visibleAsNumber("back font size", {min: 1, max: 300, step: 1})
	private	_backFontSize:	number = 24;
	@visibleAsColor4("back text color")
	private	_backColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("back positive paddings", {min: 0, step: 1})
	private	_backPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("back negative paddings", {min: 0, step: 1})
	private	_backNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("back alignments", {min: 0, max: 2, step: 1})
	private	_backAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("front font family")
	private	_backFontFamily:	string = "";
	@visibleAsNumber("back text angle", {min: 0, max: 270, step: 90})
	private	_backAngle:		number = 0;
	@visibleAsBoolean("invert back text horizontally")
	private				_isBackInverted:	boolean = false;
	private readonly	_backPlane:			Mesh;
	public readonly		backTextBlock:		TextBlock;

	@visibleAsString("right text")
	private	_rightText:	string = "";
	@visibleAsNumber("right font size", {min: 1, max: 300, step: 1})
	private	_rightFontSize:	number = 24;
	@visibleAsColor4("right text color")
	private	_rightColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("right positive paddings", {min: 0, step: 1})
	private	_rightPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("right negative paddings", {min: 0, step: 1})
	private	_rightNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("right alignments", {min: 0, max: 2, step: 1})
	private	_rightAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("right font family")
	private	_rightFontFamily:	string = "";
	@visibleAsNumber("right text angle", {min: 0, max: 270, step: 90})
	private	_rightAngle:		number = 0;
	@visibleAsBoolean("invert right text horizontally")
	private				_isRightInverted:	boolean = false;
	private readonly	_rightPlane:		Mesh;
	public readonly		rightTextBlock:		TextBlock;

	@visibleAsString("left text")
	private	_leftText:	string = "";
	@visibleAsNumber("left font size", {min: 1, max: 300, step: 1})
	private	_leftFontSize:	number = 24;
	@visibleAsColor4("left text color")
	private	_leftColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("left positive paddings", {min: 0, step: 1})
	private	_leftPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("left negative paddings", {min: 0, step: 1})
	private	_leftNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("left alignments", {min: 0, max: 2, step: 1})
	private	_leftAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("left font family")
	private	_leftFontFamily:	string = "";
	@visibleAsNumber("left text angle", {min: 0, max: 270, step: 90})
	private				_leftAngle:		number = 0;
	@visibleAsBoolean("invert left text horizontally")
	private				_isLeftInverted:	boolean = false;
	private readonly	_leftPlane:			Mesh;
	public readonly		leftTextBlock:		TextBlock;

	@visibleAsString("top text")
	private	_topText:	string = "";
	@visibleAsNumber("top font size", {min: 1, max: 300, step: 1})
	private	_topFontSize:	number = 24;
	@visibleAsColor4("top text color")
	private	_topColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("top positive paddings", {min: 0, step: 1})
	private	_topPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("top negative paddings", {min: 0, step: 1})
	private	_topNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("top alignments", {min: 0, max: 2, step: 1})
	private	_topAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("top font family")
	private	_topFontFamily:	string = "";
	@visibleAsNumber("top text angle", {min: 0, max: 270, step: 90})
	private				_topAngle:		number = 0;
	@visibleAsBoolean("invert top text horizontally")
	private				_isTopInverted:	boolean = false;
	private readonly	_topPlane:		Mesh;
	public readonly		topTextBlock:	TextBlock;

	@visibleAsString("bottom text")
	private	_bottomText:	string = "";
	@visibleAsNumber("bottom font size", {min: 1, max: 300, step: 1})
	private	_bottomFontSize:	number = 24;
	@visibleAsColor4("bottom text color")
	private	_bottomColor:		Color4 = new Color4(1, 1, 1, 1);
	@visibleAsVector2("bottom positive paddings", {min: 0, step: 1})
	private	_bottomPositivePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("bottom negative paddings", {min: 0, step: 1})
	private	_bottomNegativePaddings:	Vector2 = Vector2.Zero();
	@visibleAsVector2("bottom alignments", {min: 0, max: 2, step: 1})
	private	_bottomAlignments:	Vector2 = Vector2.Zero();
	@visibleAsString("bottom font family")
	private	_bottomFontFamily:	string = "";
	@visibleAsNumber("bottom text angle", {min: 0, max: 270, step: 90})
	private				_bottomAngle:		number = 0;
	@visibleAsBoolean("invert bottom text horizontally")
	private				_isBottomInverted:	boolean = false;
	private readonly	_bottomPlane:		Mesh;
	public readonly		bottomTextBlock:	TextBlock;

	private readonly	_extendSize:		Vector3;
	private readonly	_extendSizeScaled:	Vector3;
	private				_drew:				boolean = false;

	public constructor(public mesh: Mesh | InstancedMesh) {
		this._extendSize = this.mesh.getBoundingInfo().boundingBox.extendSize;
		if (mesh instanceof InstancedMesh)
			this._extendSizeScaled = this._extendSize.multiply(mesh.sourceMesh.absoluteScaling);
		else
			this._extendSizeScaled = this._extendSize.multiply(mesh.absoluteScaling);

		this.frontTextBlock = new TextBlock(this.mesh.name + " front text");
		this._frontPlane = MeshBuilder.CreatePlane(this.mesh.name + " front text", {width: this._extendSize.x * 2, height: this._extendSize.y * 2});
		Tags.AddTagsTo(this._frontPlane, "noClone");
		this._frontPlane.parent = this.mesh;

		this.backTextBlock = new TextBlock(this.mesh.name + " back text");
		this._backPlane = MeshBuilder.CreatePlane(this.mesh.name + " back text", {width: this._extendSize.x * 2, height: this._extendSize.y * 2});
		Tags.AddTagsTo(this._backPlane, "noClone");
		this._backPlane.parent = this.mesh;

		this.rightTextBlock = new TextBlock(this.mesh.name + " right text");
		this._rightPlane = MeshBuilder.CreatePlane(this.mesh.name + " right text", {width: this._extendSize.z * 2, height: this._extendSize.y * 2});
		Tags.AddTagsTo(this._rightPlane, "noClone");
		this._rightPlane.parent = this.mesh;

		this.leftTextBlock = new TextBlock(this.mesh.name + " left text");
		this._leftPlane = MeshBuilder.CreatePlane(this.mesh.name + " left text", {width: this._extendSize.z * 2, height: this._extendSize.y * 2});
		Tags.AddTagsTo(this._leftPlane, "noClone");
		this._leftPlane.parent = this.mesh;

		this.topTextBlock = new TextBlock(this.mesh.name + " top text");
		this._topPlane = MeshBuilder.CreatePlane(this.mesh.name + " top text", {width: this._extendSize.x * 2, height: this._extendSize.z * 2});
		Tags.AddTagsTo(this._topPlane, "noClone");
		this._topPlane.parent = this.mesh;

		this.bottomTextBlock = new TextBlock(this.mesh.name + " bottom text");
		this._bottomPlane = MeshBuilder.CreatePlane(this.mesh.name + " bottom text", {width: this._extendSize.x * 2, height: this._extendSize.z * 2});
		Tags.AddTagsTo(this._bottomPlane, "noClone");
		this._bottomPlane.parent = this.mesh;
	}

	public	clone(root: Node | IParticleSystem | Scene): IScript {
		if (!(root instanceof Mesh || root instanceof InstancedMesh))
			throw TypeError("Mesh type was expected by TextBlockDrawer");
		const	drawer:	TextBlockDrawer = new TextBlockDrawer(root);
		drawer._frontText = this._frontText;
		drawer._frontFontSize = this._frontFontSize;
		drawer._frontColor = this._frontColor.clone();
		drawer._frontPositivePaddings = this._frontPositivePaddings.clone();
		drawer._frontNegativePaddings = this._frontNegativePaddings.clone();
		drawer._frontAlignments = this._frontAlignments.clone();
		drawer._frontFontFamily = this._frontFontFamily;
		drawer._frontAngle = this._frontAngle;
		drawer._isFrontInverted = this._isFrontInverted;

		drawer._backText = this._backText;
		drawer._backFontSize = this._backFontSize;
		drawer._backColor = this._backColor.clone();
		drawer._backPositivePaddings = this._backPositivePaddings.clone();
		drawer._backNegativePaddings = this._backNegativePaddings.clone();
		drawer._backAlignments = this._backAlignments.clone();
		drawer._backFontFamily = this._backFontFamily;
		drawer._backAngle = this._backAngle;
		drawer._isBackInverted = this._isBackInverted;

		drawer._leftText = this._leftText;
		drawer._leftFontSize = this._leftFontSize;
		drawer._leftColor = this._leftColor.clone();
		drawer._leftPositivePaddings = this._leftPositivePaddings.clone();
		drawer._leftNegativePaddings = this._leftNegativePaddings.clone();
		drawer._leftAlignments = this._leftAlignments.clone();
		drawer._leftFontFamily = this._leftFontFamily;
		drawer._leftAngle = this._leftAngle;
		drawer._isLeftInverted = this._isLeftInverted;

		drawer._rightText = this._rightText;
		drawer._rightFontSize = this._rightFontSize;
		drawer._rightColor = this._rightColor.clone();
		drawer._rightPositivePaddings = this._rightPositivePaddings.clone();
		drawer._rightNegativePaddings = this._rightNegativePaddings.clone();
		drawer._rightAlignments = this._rightAlignments.clone();
		drawer._rightFontFamily = this._rightFontFamily;
		drawer._rightAngle = this._rightAngle;
		drawer._isRightInverted = this._isRightInverted;

		drawer._topText = this._topText;
		drawer._topFontSize = this._topFontSize;
		drawer._topColor = this._topColor.clone();
		drawer._topPositivePaddings = this._topPositivePaddings.clone();
		drawer._topNegativePaddings = this._topNegativePaddings.clone();
		drawer._topAlignments = this._topAlignments.clone();
		drawer._topFontFamily = this._topFontFamily;
		drawer._topAngle = this._topAngle;
		drawer._isTopInverted = this._isTopInverted;

		drawer._bottomText = this._bottomText;
		drawer._bottomFontSize = this._bottomFontSize;
		drawer._bottomColor = this._bottomColor.clone();
		drawer._bottomPositivePaddings = this._bottomPositivePaddings.clone();
		drawer._bottomNegativePaddings = this._bottomNegativePaddings.clone();
		drawer._bottomAlignments = this._bottomAlignments.clone();
		drawer._bottomFontFamily = this._bottomFontFamily;
		drawer._bottomAngle = this._bottomAngle;
		drawer._isBottomInverted = this._isBottomInverted;
		registerScriptInstance(root, drawer, "scripts/text-block.ts");
		const	scene:	Scene = root.getScene();
		if (scene.isLoading)
			scene.onBeforeRenderObservable.addOnce(() => drawer.onStart());
		else
			drawer.onStart();
		return drawer;
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
			this._renderText(this._frontText, this._frontFontSize, this._frontColor, this._frontPositivePaddings, this._frontNegativePaddings, this._frontAlignments, this._frontFontFamily, this.frontTextBlock, this._frontPlane, new Vector3(0, 0, -this._extendSize.z), new Vector3(0, this._isFrontInverted ? Math.PI : 0, this._frontAngle), whXY.rotate(this._frontAngle));
			this._renderText(this._backText, this._backFontSize, this._backColor, this._backPositivePaddings, this._backNegativePaddings, this._backAlignments, this._backFontFamily, this.backTextBlock, this._backPlane, new Vector3(0, 0, this._extendSize.z), new Vector3(0, this._isBackInverted ? 0 : Math.PI, this._backAngle), whXY.rotate(this._backAngle));
			this._renderText(this._rightText, this._rightFontSize, this._rightColor, this._rightPositivePaddings, this._rightNegativePaddings, this._rightAlignments, this._rightFontFamily, this.rightTextBlock, this._rightPlane, new Vector3(this._extendSize.x, 0, 0), new Vector3(0, this._isRightInverted ? Math.PI / 2 : -Math.PI / 2, this._rightAngle), whZY.rotate(this._rightAngle));
			this._renderText(this._leftText, this._leftFontSize, this._leftColor, this._leftPositivePaddings, this._leftNegativePaddings, this._leftAlignments, this._leftFontFamily, this.leftTextBlock, this._leftPlane, new Vector3(-this._extendSize.x, 0, 0), new Vector3(0, this._isLeftInverted ? -Math.PI / 2 : Math.PI / 2, this._leftAngle), whZY.rotate(this._leftAngle));
			this._renderText(this._topText, this._topFontSize, this._topColor, this._topPositivePaddings, this._topNegativePaddings, this._topAlignments, this._topFontFamily, this.topTextBlock, this._topPlane, new Vector3(0, this._extendSize.y, 0), new Vector3(this._isTopInverted ? -Math.PI / 2 : Math.PI / 2, this._topAngle, 0), whXZ.rotate(this._topAngle));
			this._renderText(this._bottomText, this._bottomFontSize, this._bottomColor, this._bottomPositivePaddings, this._bottomNegativePaddings, this._bottomAlignments, this._bottomFontFamily, this.bottomTextBlock, this._bottomPlane, new Vector3(0, -this._extendSize.y, 0), new Vector3(this._isBottomInverted ? Math.PI / 2 : -Math.PI / 2, this._bottomAngle, 0), whXZ.rotate(this._bottomAngle));
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
			const	dynText:	AdvancedDynamicTexture = AdvancedDynamicTexture.CreateForMesh(plane, Math.abs(widthHeight.x) * 2, Math.abs(widthHeight.y) * 2, false);
			dynText.addControl(textBlock);
		} else
			plane.setEnabled(false);
	}
}
