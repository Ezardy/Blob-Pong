import { Color3, Color4, ISize, MeshBuilder, MeshUVSpaceRenderer, PBRMaterial, Texture, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { IScript, visibleAsNumber, visibleAsTexture } from "babylonjs-editor-tools";

export default class IconDrawer implements IScript {
	@visibleAsTexture("left icon")
	private readonly	_leftIcon?:		Texture;
	@visibleAsNumber("left icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_leftIconSize:	number = 1;
	@visibleAsTexture("right icon")
	private readonly	_rightIcon?:	Texture;
	@visibleAsNumber("right icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_rightIconSize:	number = 1;
	@visibleAsTexture("upper icon")
	private readonly	_upperIcon?:	Texture;
	@visibleAsNumber("upper icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_upperIconSize:	number = 1;
	@visibleAsTexture("lower icon")
	private readonly	_lowerIcon?:	Texture;
	@visibleAsNumber("lower icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_lowerIconSize:	number = 1;
	@visibleAsTexture("top icon")
	private readonly	_topIcon?:		Texture;
	@visibleAsNumber("top icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_topIconSize:	number = 1;
	@visibleAsTexture("bottom icon")
	private readonly	_bottomIcon?:	Texture;
	@visibleAsNumber("bottom icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_bottomIconSize:	number = 1;

	public constructor(public mesh: Mesh) { }

	public onStart(): void {
		const	extendSize:	Vector3 = this.mesh.getBoundingInfo().boundingBox.extendSize;
		const	buttonSize:	Vector3 = new Vector3(extendSize.x * this.mesh.absoluteScaling.x, extendSize.y * this.mesh.absoluteScaling.y, extendSize.z * this.mesh.absoluteScaling.z);
		const	decalMap:	MeshUVSpaceRenderer = new MeshUVSpaceRenderer(this.mesh, this.mesh.getScene());
		const	material:	PBRMaterial = this.mesh.material as PBRMaterial;
		const	color:		Color3 = material.albedoColor;
		const	rotation:	Vector3 = this.mesh.absoluteRotationQuaternion.toEulerAngles();
		this.mesh.decalMap = decalMap;
		material.decalMap!.isEnabled = true;
		this.mesh.decalMap.clearColor = new Color4(color.r, color.g, color.b, 0);
		this.mesh.decalMap.clear();
		material.decalMap!.smoothAlpha = true;
		if (this._topIcon != undefined) {
			this._topIcon.hasAlpha = true;
			this._topIcon.wrapU = Texture.CLAMP_ADDRESSMODE;
			this._topIcon.wrapV = Texture.CLAMP_ADDRESSMODE;
			const	textureSize:	ISize = this._topIcon.getBaseSize();
			var		widthScale:		number = 1;
			var		heightScale:	number = 1;
			if (buttonSize.x > buttonSize.y)
				heightScale = buttonSize.y / buttonSize.x;
			else
				widthScale = buttonSize.x / buttonSize.y;
			const	normal = this.mesh.forward.negate();
			decalMap.renderTexture(this._topIcon!,
				this.mesh.absolutePosition.add(normal.scale(buttonSize.z)),
				normal,
				new Vector3(textureSize.width * widthScale * this._topIconSize, textureSize.height * heightScale * this._topIconSize, 1), rotation.z);
		}
	}
}
