import { Axis, Color3, Color4, ISize, MeshUVSpaceRenderer, PBRMaterial, Quaternion, Texture, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { IScript, visibleAsBoolean, visibleAsNumber, visibleAsTexture } from "babylonjs-editor-tools";
import { IRenderOnStart } from "./interfaces/irenderonstart";

export default class IconDrawer implements IScript, IRenderOnStart {
	@visibleAsBoolean("render on start")
	private	_renderOnStart = true;
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
	@visibleAsTexture("top icon")
	private readonly	_topIcon?:	Texture;
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
	@visibleAsTexture("front icon")
	private readonly	_frontIcon?:		Texture;
	@visibleAsNumber("front icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_frontIconSize:	number = 1;
	@visibleAsNumber("front icon angle", {min: 0, max: 359, step: 1})
	private readonly	_frontIconAngle:	number = 0;
	@visibleAsTexture("back icon")
	private readonly	_backIcon?:	Texture;
	@visibleAsNumber("back icon size", {min: 0, max: 1, step: 0.005})
	private readonly	_backIconSize:	number = 1;
	@visibleAsNumber("back icon angle", {min: 0, max: 359, step: 1})
	private readonly	_backIconAngle:	number = 0;
	@visibleAsBoolean("clonable", {description: "Is this script will be cloned during cloneNodeWithScripts execution"})

	private				_isDrew:				boolean = false;

	public get	isRendered(): boolean {
		return this._isDrew;
	}

	public set	isRendered(value: boolean) {
		this._isDrew = value;
	}

	public get	renderOnStart():	boolean {
		return this._renderOnStart;
	}

	public set	renderOnStart(value: boolean) {
		this._renderOnStart = value;
	}

	public render():	void {
		this._draw();
	}

	public constructor(public mesh: Mesh) {
		if (Vector3.Cross(this.mesh.up, Vector3.Up()).length() == 0)
			this.mesh.rotate(Axis.Z, 1e-6);
		mesh.computeWorldMatrix(true);
		mesh.decalMap = new MeshUVSpaceRenderer(mesh, mesh.getScene());
		const	material:	PBRMaterial = mesh.material as PBRMaterial;
		const	color:		Color3 = material.albedoColor;
		material.decalMap!.isEnabled = true;
		mesh.decalMap.clearColor = new Color4(color.r, color.g, color.b, 0);
		mesh.decalMap.clear();
		material.decalMap!.smoothAlpha = true;
	}

	public	onStart(): void {
		if (this.renderOnStart)
			this._draw();
	}

	private	_draw():	void {
		if (!this._isDrew) {
			const	extendSize:	Vector3 = this.mesh.getBoundingInfo().boundingBox.extendSize;
			const	meshSize:	Vector3 = new Vector3(extendSize.x * this.mesh.absoluteScaling.x, extendSize.y * this.mesh.absoluteScaling.y, extendSize.z * this.mesh.absoluteScaling.z);

			var		angle:		number = 0;
			const	rotation:	Vector3 = this.mesh.absoluteRotationQuaternion ? this.mesh.absoluteRotationQuaternion.toEulerAngles() : this.mesh.rotation;
			const	yP:			Vector3 = new Vector3(this.mesh.up.x, 0, this.mesh.up.z);
			yP.normalize().applyRotationQuaternionInPlace(Quaternion.RotationYawPitchRoll(Math.PI / 2, 0, 0));
			const	cross:	Vector3 = Vector3.Cross(this.mesh.right, yP);
			angle = Math.atan2(cross.length() * Math.sign(Vector3.Dot(cross.normalizeToNew(), this.mesh.up.negate())), Vector3.Dot(this.mesh.right, yP));

			this._drawIconSafe(this._bottomIcon, this.mesh.up.negate(), meshSize.x, meshSize.z, meshSize.y, this._bottomIconSize, angle + this._bottomIconAngle * Math.PI / 180);
			this._drawIconSafe(this._topIcon, this.mesh.up, meshSize.x, meshSize.z, meshSize.y, this._topIconSize, -angle + this._topIconAngle * Math.PI / 180);
			this._drawIconSafe(this._rightIcon, this.mesh.right, meshSize.z, meshSize.y, meshSize.x, this._rightIconSize, -rotation.x + this._rightIconAngle * Math.PI / 180);
			this._drawIconSafe(this._leftIcon, this.mesh.right.negate(), meshSize.z, meshSize.y, meshSize.x, this._leftIconSize, rotation.x + this._leftIconAngle * Math.PI / 180);
			this._drawIconSafe(this._frontIcon, this.mesh.forward.negate(), meshSize.x, meshSize.y, meshSize.z, this._frontIconSize, rotation.z + this._frontIconAngle * Math.PI / 180);
			this._drawIconSafe(this._backIcon, this.mesh.forward, meshSize.x, meshSize.y, meshSize.z, this._backIconSize, -rotation.z + this._backIconAngle * Math.PI / 180);
			this._isDrew = true;
		}
	}

	private	_drawIconSafe(icon: Texture | undefined, normal: Vector3, width: number, height: number, depth: number, size: number, angle: number): void {
		if (icon != undefined) {
			if (icon.isReady())
				this._drawIcon(icon, normal, width, height, depth, size, angle);
			else 
				icon.onLoadObservable.addOnce(() => this._drawIcon(icon, normal, width, height, depth, size, angle));
		}
	}

	private	_drawIcon(icon: Texture, normal: Vector3, width: number, height: number, depth: number, size: number, angle: number): void {
		icon.hasAlpha = true;
		icon.wrapU = Texture.CLAMP_ADDRESSMODE;
		icon.wrapV = Texture.CLAMP_ADDRESSMODE;
		const	maxSize:		number = Math.max(width, height) * 2;
		const	textureSize:	ISize = icon.getBaseSize();
		var		widthScale:		number = 1;
		var		heightScale:	number = 1;
		if (textureSize.width > textureSize.height)
			heightScale = textureSize.height / textureSize.width;
		else
			widthScale = textureSize.width / textureSize.height;
		const	decalSize:	Vector3 = new Vector3(maxSize * widthScale * size, maxSize * heightScale * size, 1);
		this.mesh.decalMap!.renderTexture(icon,
			this.mesh.absolutePosition.add(normal.scale(depth)),
			normal,
			decalSize, angle);
	}
}
