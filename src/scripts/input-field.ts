import { Color3, Color4, int, IParticleSystem, MeshBuilder, Scene, Tags, Vector3, Node, InstancedMesh, AbstractMesh, ICanvasRenderingContext, Tools } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture, Control, InputTextArea } from "@babylonjs/gui";
import { IScript, _registerScriptInstance, applyScriptOnObject, visibleAsBoolean, visibleAsColor4, visibleAsNumber, visibleAsString } from "babylonjs-editor-tools";
import { IClonableScript } from "./interfaces/iclonablescript";
import { updateBoundingBoxRecursively } from "./functions/bounding-box";
import { fitTextIntoControl } from "./functions/text";

export default class InputField3D implements IScript, IClonableScript {
	@visibleAsBoolean("resize text to fit")
	private	_resizeTextToFit:	boolean = false;
	@visibleAsNumber("texture resolution scaler", {min: 1, max: 10, step: 1})
	private	_textureResolutionScaler:	int = 1;
	@visibleAsString("font family")
	private	_fontFamily:	string = "Arial";
	@visibleAsNumber("font weight", {min: 100, max: 900, step: 1})
	private	_fontWeight:	number = 400;
	@visibleAsString("hint")
	private	_hint:	string = "";
	@visibleAsNumber("hint size", {min: 1, max: 80, step: 1})
	private	_hintSize:	number = 20;
	@visibleAsColor4("hint color")
	private	_hintColor:	Color4 = Color4.FromColor3(Color3.Gray());
	@visibleAsNumber("max text size", {min: 1, max: 100, step: 1})
	private	_maxTextSize:	number = 80;
	@visibleAsNumber("min text size", {min: 1, max: 99, step: 1})
	private	_minTextSize:	number = 5;
	@visibleAsColor4("text color")
	private	_textColor:	Color4 = Color4.FromColor3(Color3.White());
	@visibleAsColor4("background color")
	private	_backgroundColor:	Color4 = Color4.FromColor3(Color3.Black());
	@visibleAsColor4("focused background color")
	private	_focusedBackgroundColor:	Color4 = Color4.FromColor3(Color3.Black());
	@visibleAsColor4("highlight color")
	private	_highlightColor:	Color4 = new Color4(1, 1, 1, 0.4);
	@visibleAsNumber("border thickness", {min: 0, max: 20, step: 1})
	private	_borderThickness:	int = 1;

	private readonly	_inputText:			InputTextArea;
	private readonly	_plane:				Mesh;
	private readonly	_extendSizeScaled:	Vector3;
	private				_hintShowed:		boolean = true;
	private				_drew:				boolean = false;

	private static readonly	_inputTextAreas:	Array<InputTextArea> = [];

	public	parser:	(input: string) => string = (i) => i;

	public get	inputTextArea():	InputTextArea {
		return this._inputText;
	}

	public constructor(public mesh: AbstractMesh) {
		if (mesh instanceof InstancedMesh)
			mesh.refreshBoundingInfo();
		updateBoundingBoxRecursively(mesh);
		const	extendSize:			Vector3 = this.mesh.getBoundingInfo().boundingBox.extendSize;
		if (mesh instanceof InstancedMesh)
			this._extendSizeScaled = extendSize.multiply(mesh.sourceMesh.absoluteScaling);
		else
			this._extendSizeScaled = extendSize.multiply(mesh.absoluteScaling);
		this._plane = MeshBuilder.CreatePlane(this.mesh.name + "_front_text", {width: extendSize.x * 2, height: extendSize.y * 2});
		Tags.AddTagsTo(this._plane, "noClone");
		this._plane.parent = mesh;
		this._plane.position.z -= extendSize.z + 0.01;
		this._inputText = new InputTextArea(mesh.name + " input");
		InputField3D._inputTextAreas.push(this._inputText);
		this._inputText.onFocusObservable.add(() => {
			for (const field of InputField3D._inputTextAreas) {
				if (field !== this._inputText)
					field.blur();
			}
			if (this._hintShowed) {
				this._inputText.placeholderText = "";
				this._inputText.fontSize = `${this._maxTextSize}%`;
				this._hintShowed = false;
			}
		});
		this._inputText.onBlurObservable.add(() => {
			if (!this._hintShowed) {
				if (this._inputText.text.length == 0) {
					this._inputText.placeholderText = this._hint;
					this._hintShowed = true;
					this._inputText.fontSize = `${this._hintSize}%`;
				} else
					this._inputText.text = this.parser(this._inputText.text);
			}
		});
	}

	public	clone(root: Node | IParticleSystem | Scene):	IScript {
		if (!(root instanceof Mesh))
			throw TypeError("Mesh type was expected by InputField3D");
		const	field:	InputField3D = applyScriptOnObject(root, InputField3D);
		field._fontFamily = this._fontFamily;
		field._fontWeight = this._fontWeight;
		field._resizeTextToFit = this._resizeTextToFit;
		field._textureResolutionScaler = this._textureResolutionScaler;
		field._hint = this._hint;
		field._hintSize = this._hintSize;
		field._hintColor = this._hintColor.clone();
		field._minTextSize = this._minTextSize;
		field._maxTextSize = this._maxTextSize;
		field._textColor = this._textColor.clone();
		field._backgroundColor = this._backgroundColor.clone();
		field._focusedBackgroundColor = this._focusedBackgroundColor.clone();
		field._highlightColor = this._highlightColor.clone();
		field._borderThickness = this._borderThickness;
		const	scene:	Scene = root.getScene();
		if (scene.isLoading)
			root.getScene()?.onBeforeRenderObservable.addOnce(() => field.onStart());
		else
			field.onStart();
		return field;
	}

	public	onStart():	void {
		this.draw();
	}

	public	draw():	void {
		if (!this._drew) {
			this._maxTextSize = Math.max(this._maxTextSize, this._minTextSize);
			this._hint = JSON.parse(`"${this._hint}"`);
			const	dynText:	AdvancedDynamicTexture = AdvancedDynamicTexture.CreateForMesh(this._plane, this._extendSizeScaled.x * this._textureResolutionScaler, this._extendSizeScaled.y * this._textureResolutionScaler, false);
			if (this._resizeTextToFit)
				this._inputText.onTextChangedObservable.add(() => fitTextIntoControl(this._inputText, dynText.getContext(), this._minTextSize, this._maxTextSize));
			dynText.skipBlockEvents = 0;
			dynText.addControl(this._inputText);
			this._inputText.fontWeight = this._fontWeight.toString();
			this._inputText.placeholderText = this._hint;
			this._inputText.placeholderColor = this._hintColor.toHexString();
			this._inputText.textHighlightColor = new Color3(this._highlightColor.r, this._highlightColor.g, this._highlightColor.b).toHexString();
			this._inputText.highligherOpacity = this._highlightColor.a;
			this._inputText.fontSize = `${this._hintSize}%`;
			if (this._fontFamily.length)
				document.fonts.ready.then((v) => v.load(`${this._inputText.fontWeight} ${this._inputText.fontSizeInPixels}px ${this._fontFamily}`).then(() => this._inputText.fontFamily = this._fontFamily));
			this._inputText.background = this._backgroundColor.toHexString();
			this._inputText.focusedBackground = this._focusedBackgroundColor.toHexString();
			this._inputText.color = this._textColor.toHexString();
			//this._inputText.autoStretchWidth = true;
			this._inputText.autoStretchHeight = true;
			this._inputText.margin = "1px";
			this._inputText.setPaddingInPixels(0, 0, 0, 0);
			this._inputText.thickness = this._borderThickness * this._textureResolutionScaler;
			this._inputText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
			this._inputText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
			this._drew = true;
		}
	}
}
