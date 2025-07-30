import { Color3, Color4, int, ISize, MeshBuilder, MeshUVSpaceRenderer, PBRMaterial, Quaternion, Texture, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { IScript, visibleAsNumber, visibleAsTexture } from "babylonjs-editor-tools";

export default class IconDrawer implements IScript {
	@visibleAsTexture("left icon")
	private readonly	_leftIcon?:		Texture;
	@visibleAsNumber("left icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_leftIconSize:	number = 1;
	@visibleAsNumber("left icon angle", {min: 0, max: 359, step: 1})
	private readonly	_leftIconAngle:	number = 0;
	@visibleAsTexture("right icon")
	private readonly	_rightIcon?:	Texture;
	@visibleAsNumber("right icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_rightIconSize:	number = 1;
	@visibleAsNumber("right icon angle", {min: 0, max: 359, step: 1})
	private readonly	_rightIconAngle:	number = 0;
	@visibleAsTexture("upper icon")
	private readonly	_upperIcon?:	Texture;
	@visibleAsNumber("upper icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_upperIconSize:	number = 1;
	@visibleAsNumber("upper icon angle", {min: 0, max: 359, step: 1})
	private readonly	_upperIconAngle:	number = 0;
	@visibleAsTexture("lower icon")
	private readonly	_lowerIcon?:	Texture;
	@visibleAsNumber("lower icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_lowerIconSize:	number = 1;
	@visibleAsNumber("lower icon angle", {min: 0, max: 359, step: 1})
	private readonly	_lowerIconAngle:	number = 0;
	@visibleAsTexture("top icon")
	private readonly	_topIcon?:		Texture;
	@visibleAsNumber("top icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_topIconSize:	number = 1;
	@visibleAsNumber("top icon angle", {min: 0, max: 359, step: 1})
	private readonly	_topIconAngle:	number = 0;
	@visibleAsTexture("bottom icon")
	private readonly	_bottomIcon?:	Texture;
	@visibleAsNumber("bottom icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_bottomIconSize:	number = 1;
	@visibleAsNumber("bottom icon angle", {min: 0, max: 359, step: 1})
	private readonly	_bottomIconAngle:	number = 0;

	private readonly	_decalMap:	MeshUVSpaceRenderer;
	private readonly	_rotation:	Quaternion;

	public constructor(public mesh: Mesh) {
		this._rotation = mesh.rotationQuaternion!;
		mesh.rotationQuaternion = Quaternion.Identity();
		mesh.computeWorldMatrix(true);
		this._decalMap = new MeshUVSpaceRenderer(this.mesh, this.mesh.getScene());
		const	material:	PBRMaterial = this.mesh.material as PBRMaterial;
		const	color:		Color3 = material.albedoColor;
		this.mesh.decalMap = this._decalMap;
		material.decalMap!.isEnabled = true;
		this.mesh.decalMap.clearColor = new Color4(color.r, color.g, color.b, 0);
		this.mesh.decalMap.clear();
		material.decalMap!.smoothAlpha = true;
	}

	public onStart(): void {
		const	extendSize:	Vector3 = this.mesh.getBoundingInfo().boundingBox.extendSize;
		const	meshSize:	Vector3 = new Vector3(extendSize.x * this.mesh.absoluteScaling.x, extendSize.y * this.mesh.absoluteScaling.y, extendSize.z * this.mesh.absoluteScaling.z);
		this._drawSafe(this._lowerIcon, this.mesh.up.negate(), meshSize.x, meshSize.z, meshSize.y, this._lowerIconSize, this._lowerIconAngle * 2 * Math.PI / 360);
		this._drawSafe(this._upperIcon, this.mesh.up, meshSize.x, meshSize.z, meshSize.y, this._upperIconSize, this._upperIconAngle * 2 * Math.PI / 360);
		this._drawSafe(this._rightIcon, this.mesh.right, meshSize.z, meshSize.y, meshSize.x, this._rightIconSize, this._rightIconAngle * 2 * Math.PI / 360);
		this._drawSafe(this._leftIcon, this.mesh.right.negate(), meshSize.z, meshSize.y, meshSize.x, this._leftIconSize, this._leftIconAngle * 2 * Math.PI / 360);
		this._drawSafe(this._topIcon, this.mesh.forward.negate(), meshSize.x, meshSize.y, meshSize.z, this._topIconSize, this._topIconAngle * 2 * Math.PI / 360);
		this._drawSafe(this._bottomIcon, this.mesh.forward, meshSize.x, meshSize.y, meshSize.z, this._bottomIconSize, this._bottomIconAngle * 2 * Math.PI / 360);
		
		setTimeout(() => this.mesh.rotationQuaternion = this._rotation, 100);
	}

	private	_drawSafe(icon: Texture | undefined, normal: Vector3, width: number, height: number, depth: number, size: number, angle: number): void {
		if (icon != undefined) {
			if (icon.isReady()) {
				this._draw(icon, normal, width, height, depth, size, angle);
			} else {
				icon.onLoadObservable.addOnce(() => {
					this._draw(icon, normal, width, height, depth, size, angle);
				});
			}
		}
	}

	private	_draw(icon: Texture, normal: Vector3, width: number, height: number, depth: number, size: number, angle: number): void {
		icon.hasAlpha = true;
		icon.wrapU = Texture.CLAMP_ADDRESSMODE;
		icon.wrapV = Texture.CLAMP_ADDRESSMODE;
		const	minSize:		number = Math.min(width, height) * 2;
		const	textureSize:	ISize = icon.getBaseSize();
		var		widthScale:		number = 1;
		var		heightScale:	number = 1;
		if (width > height)
			heightScale = textureSize.width / textureSize.height;
		else
			widthScale = textureSize.height / textureSize.width;
		this._decalMap.renderTexture(icon,
			this.mesh.absolutePosition.add(normal.scale(depth)),
			normal,
			new Vector3(minSize * widthScale * size, minSize * heightScale * size, 1), angle);
	}
}
