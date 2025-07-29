import { Color3, Color4, int, ISize, MeshBuilder, MeshUVSpaceRenderer, PBRMaterial, Texture, Vector3 } from "@babylonjs/core";
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

	private readonly	_meshSize:	number[];
	private readonly	_decalMap:	MeshUVSpaceRenderer;
	private readonly	_rotation:	number[];

	public constructor(public mesh: Mesh) {
		const	extendSize:	Vector3 = this.mesh.getBoundingInfo().boundingBox.extendSize;
		this._meshSize = [extendSize.x * this.mesh.absoluteScaling.x, extendSize.y * this.mesh.absoluteScaling.y, extendSize.z * this.mesh.absoluteScaling.z];
		this._decalMap = new MeshUVSpaceRenderer(this.mesh, this.mesh.getScene());
		this._rotation = this.mesh.absoluteRotationQuaternion.toEulerAngles().asArray();
		console.log(this.mesh.absoluteRotationQuaternion.toEulerAngles());
		const	material:	PBRMaterial = this.mesh.material as PBRMaterial;
		const	color:		Color3 = material.albedoColor;
		this.mesh.decalMap = this._decalMap;
		material.decalMap!.isEnabled = true;
		this.mesh.decalMap.clearColor = new Color4(color.r, color.g, color.b, 0);
		this.mesh.decalMap.clear();
		material.decalMap!.smoothAlpha = true;
	}

	public onStart(): void {
		this._drawSafe(this._topIcon, this.mesh.forward.negate(), 2, this._topIconSize, 1);
		this._drawSafe(this._bottomIcon, this.mesh.forward, 2, this._bottomIconSize, -1);
		this._drawSafe(this._leftIcon, this.mesh.right.negate(), 0, this._leftIconSize, 1);
		this._drawSafe(this._rightIcon, this.mesh.right, 0, this._rightIconSize, -1);
		this._drawSafe(this._upperIcon, this.mesh.up, 1, this._upperIconSize, -1);
		this._drawSafe(this._lowerIcon, this.mesh.up.negate(), 1, this._lowerIconSize, -1);
	}

	private	_drawSafe(icon: Texture | undefined, normal: Vector3, i: int, size: number, dir: int): void {
		if (icon != undefined) {
			if (icon.isReady())
				this._draw(icon, normal, i, size, dir);
			else
				icon.onLoadObservable.addOnce(() => this._draw(icon, normal, i, size, dir));
		}
	}

	private	_draw(icon: Texture, normal: Vector3, i: int, size: number, dir: int): void {
		icon.hasAlpha = true;
		icon.wrapU = Texture.CLAMP_ADDRESSMODE;
		icon.wrapV = Texture.CLAMP_ADDRESSMODE;
		const	textureSize:	ISize = icon.getBaseSize();
		var		widthScale:		number = 1;
		var		heightScale:	number = 1;
		const	i1:	int = (i + 1) % 3;
		const	i2:	int = (i + 2) % 3;
		if (this._meshSize[i1] > this._meshSize[i2])
			heightScale = this._meshSize[i2] / this._meshSize[i1];
		else
			widthScale = this._meshSize[i1] / this._meshSize[i2];
		this._decalMap.renderTexture(icon,
			this.mesh.absolutePosition.add(normal.scale(this._meshSize[i])),
			normal,
			new Vector3(textureSize.width * widthScale * size, textureSize.height * heightScale * size, 1), this._rotation[i] * dir);
	}
}
