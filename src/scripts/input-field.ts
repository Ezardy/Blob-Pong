import { Color3, Color4, int, MeshBuilder, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture, Control, InputTextArea } from "@babylonjs/gui";
import { IScript, visibleAsColor4, visibleAsNumber, visibleAsString } from "babylonjs-editor-tools";

export default class InputField3D implements IScript {
	@visibleAsNumber("texture resolution scaler", {min: 1, max: 10, step: 1})
	private readonly	_textureResolutionScaler:	int = 1;
	@visibleAsString("hint")
	private	_hint:	string = "";
	@visibleAsNumber("hint size", {min: 1, max: 300, step: 1})
	private readonly	_hintSize:	number = 12;
	@visibleAsColor4("hint color")
	private readonly	_hintColor:	Color4 = Color4.FromColor3(Color3.Gray());
	@visibleAsNumber("text size", {min: 1, max: 300, step: 1})
	private readonly	_textSize:	number = 12;
	@visibleAsColor4("text color")
	private readonly	_textColor:	Color4 = Color4.FromColor3(Color3.White());
	@visibleAsColor4("background color")
	private readonly	_backgroundColor:	Color4 = Color4.FromColor3(Color3.Black());
	@visibleAsColor4("focused background color")
	private readonly	_focusedBackgroundColor:	Color4 = Color4.FromColor3(Color3.Black());
	@visibleAsColor4("highlight color")
	private readonly	_highlightColor:	Color4 = new Color4(1, 1, 1, 0.4);
	@visibleAsNumber("border thickness", {min: 0, max: 20, step: 1})
	private readonly	_borderThickness:	int = 1;

	private readonly	_inputText:			InputTextArea;
	private readonly	_plane:				Mesh;
	private readonly	_extendSizeScaled:	Vector3;
	private				_hintShowed:		boolean = true;
	private				_drew:				boolean = false;

	public	parser:	(input: string) => string = (i) => i;

	public get	inputTextArea():	InputTextArea {
		return this._inputText;
	}

	public constructor(public mesh: Mesh) {
		const	extendSize:			Vector3 = this.mesh.getBoundingInfo().boundingBox.extendSize;
		this._extendSizeScaled = extendSize.multiply(mesh.absoluteScaling);
		this._plane = MeshBuilder.CreatePlane(this.mesh.name + "_front_text", {width: extendSize.x * 2, height: extendSize.y * 2});
		this._plane.parent = mesh;
		this._plane.position.z -= extendSize.z + 0.01;
		this._inputText = new InputTextArea(mesh.name + " input");
		this._inputText.onFocusObservable.add(() => {
			if (this._hintShowed) {
				this._inputText.fontSize = this._textSize * this._textureResolutionScaler;
				this._inputText.color = this._textColor.toHexString();
				this._inputText.text = "";
				this._hintShowed = false;
			}
		});
		this._inputText.onBlurObservable.add(() => {
			if (!this._hintShowed) {
				if (this._inputText.text.length == 0) {
					this._hintShowed = true;
					this._inputText.fontSize = this._hintSize * this._textureResolutionScaler;
					this._inputText.color = this._hintColor.toHexString();
					this._inputText.text = this._hint;
				} else
					this._inputText.text = this.parser(this._inputText.text);
			}
		});
	}

	public	onStart():	void {
		this.draw();
	}

	public	draw():	void {
		if (!this._drew) {
			this._hint = JSON.parse(`"${this._hint}"`);
			const	dynText:	AdvancedDynamicTexture = AdvancedDynamicTexture.CreateForMesh(this._plane, this._extendSizeScaled.x * this._textureResolutionScaler, this._extendSizeScaled.y * this._textureResolutionScaler, false);
			dynText.skipBlockEvents = 0;
			dynText.addControl(this._inputText);
			this._inputText.textHighlightColor = new Color3(this._highlightColor.r, this._highlightColor.g, this._highlightColor.b).toHexString();
			this._inputText.highligherOpacity = this._highlightColor.a;
			this._inputText.text = this._hint;
			this._inputText.fontSize = this._hintSize * this._textureResolutionScaler;
			this._inputText.background = this._backgroundColor.toHexString();
			this._inputText.focusedBackground = this._focusedBackgroundColor.toHexString();
			this._inputText.color = this._hintColor.toHexString();
			this._inputText.autoStretchWidth = true;
			this._inputText.autoStretchHeight = true;
			this._inputText.margin = "1px";
			this._inputText.thickness = this._borderThickness * this._textureResolutionScaler;
			this._inputText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
			this._inputText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
			this._drew = true;
		}
	}
}
