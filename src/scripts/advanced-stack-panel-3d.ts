import { AbstractEngine, Camera, Color3, Engine, int, LinesMesh, Matrix, Mesh, MeshBuilder, Nullable, Plane, Ray, Scene, TmpVectors, Tools, Vector3 } from "@babylonjs/core";
import { Container3D, Control3D } from "@babylonjs/gui";

export class AdvancedStackPanel3D extends Container3D {
	public static readonly	START_ALIGNMENT = 1;
	public static readonly	END_ALIGNMENT = 2;
	public static readonly	CENTER_ALIGNMENT = 0;

	private	_isVertical:	boolean;
	private	_alignment:		int;
	private	_extendSizes:	Map<int, Vector3> = new Map();

	/**
	 * Gets or sets a boolean indicating if the stack panel is vertical or horizontal (horizontal by default)
	 */
	public get isVertical(): boolean {
		return this._isVertical;
	}

	public set isVertical(value: boolean) {
		if (this._isVertical === value) {
			return;
		}

		this._isVertical = value;

		Tools.SetImmediate(() => {
			this._arrangeChildren();
		});
	}

	/**
	 * Gets or sets the distance between elements
	 */
	public margin = 0.1;

	public offset = 1;

	/**
	 * Creates new StackPanel
	 * @param isVertical
	 */
	public constructor(isVertical: boolean = false, alignment: int = 0) {
		super();

		this._isVertical = isVertical;
		this._alignment = alignment;
	}

	protected override _arrangeChildren() {
		let width = 0;
		let height = 0;
		let index = 0;
		this._extendSizes.clear();

		const	currentInverseWorld = Matrix.Invert(this.node!.computeWorldMatrix(true));

		// Measure
		for (const child of this._children) {
			if (child.node && child.isVisible) {
				child.node.computeWorldMatrix(true);
				const	boundingVectors:	{min: Vector3, max: Vector3} = child.node.getHierarchyBoundingVectors(true, (am) => am && am.isVisible && am.isEnabled());
				if (Math.abs(boundingVectors.min.x) != Number.MAX_VALUE
					&& Math.abs(boundingVectors.min.y) != Number.MAX_VALUE
					&& Math.abs(boundingVectors.min.z) != Number.MAX_VALUE
					&& Math.abs(boundingVectors.max.x) != Number.MAX_VALUE
					&& Math.abs(boundingVectors.max.y) != Number.MAX_VALUE
					&& Math.abs(boundingVectors.max.z) != Number.MAX_VALUE) {
					let	extendSize:	Vector3;
					if (child.mesh) {
						child.mesh.getWorldMatrix().multiplyToRef(currentInverseWorld, TmpVectors.Matrix[0]);
						const	boundingBox:	Vector3 = child.mesh.getBoundingInfo().boundingBox.extendSize;
						extendSize = Vector3.TransformNormal(boundingBox, TmpVectors.Matrix[0]);
					} else {
						const	worldBoundingBox:	Vector3 = boundingVectors.max.subtract(boundingVectors.min).scaleInPlace(0.5);
						extendSize = Vector3.TransformNormal(worldBoundingBox, currentInverseWorld);
					}
					if (this._isVertical)
						height += extendSize.y;
					else
						width += extendSize.x;
					this._extendSizes.set(index, extendSize);
				}
			}
			index += 1;
		}

		let	controlCount:	int = this._extendSizes.size;
		let	_offset: number;
		if (this._isVertical) {
			height += ((controlCount - 1) * this.margin) / 2;
			_offset = -height;
		} else {
			width += ((controlCount - 1) * this.margin) / 2;
			_offset = -width;
		}

		index = 0;
		for (const child of this._children) {
			if (child.node && this._extendSizes.has(index)) {
				controlCount -= 1;
				const extendSize = this._extendSizes.get(index)!;

				if (this._isVertical) {
					child.position.y = _offset + extendSize.y;
					child.position.x = 0;
					_offset += extendSize.y * 2;
				} else {
					child.position.x = _offset + extendSize.x;
					child.position.y = 0;
					_offset += extendSize.x * 2;
				}
				_offset += controlCount > 0 ? this.margin : 0;
			}
			index += 1;
		}

		if (this._alignment != AdvancedStackPanel3D.CENTER_ALIGNMENT) {
			if (this._alignment == AdvancedStackPanel3D.START_ALIGNMENT) {
				if (this._isVertical)
					this._positionNode(0.5, 0, 0, -1, currentInverseWorld);
				else
					this._positionNode(0, 0.5, 1, 0, currentInverseWorld);
			} else {
				if (this._isVertical)
					this._positionNode(0.5, 1, 0, 1, currentInverseWorld);
				else
					this._positionNode(1, 0.5, -1, 0, currentInverseWorld);
			}
		}

	}

	private	_positionNode(pX: number, pY: number, oX: number, oY: number, nodeInverseWorld: Matrix):	void {
		const	worldBoundingPoints:	{min: Vector3, max: Vector3} = this.node!.getHierarchyBoundingVectors(true, (am) => am && am.isVisible && am.isEnabled());
		const	minBoundingPoint:		Vector3 = Vector3.TransformCoordinates(worldBoundingPoints.min, nodeInverseWorld);
		const	maxBoundingPoint:		Vector3 = Vector3.TransformCoordinates(worldBoundingPoints.max, nodeInverseWorld);
		const	extendSize:				Vector3 = maxBoundingPoint.subtract(minBoundingPoint).scaleInPlace(0.5);
		const	centerOfBounds:			Vector3 = maxBoundingPoint.add(minBoundingPoint).scaleInPlace(0.5);
		const	scene:					Scene = this.node!.getScene();
		const	camera:					Camera = scene.activeCamera!;
		const	engine:					AbstractEngine = scene.getEngine();
		const	ray:					Ray = scene.createPickingRay(engine.getRenderWidth() * pX, engine.getRenderHeight() * pY, this.node!.getWorldMatrix(), camera);
		const	plane:					Plane = Plane.FromPositionAndNormal(minBoundingPoint, new Vector3(0, 0, -1));
		const	distance:				Nullable<number> = ray.intersectsPlane(plane);

		/*
		const	line:	LinesMesh = MeshBuilder.CreateLines(this.name + " line", {points: [
			worldBoundingPoints.min,
			new Vector3(worldBoundingPoints.max.x, worldBoundingPoints.min.y, worldBoundingPoints.min.z),
			new Vector3(worldBoundingPoints.max.x, worldBoundingPoints.max.y, worldBoundingPoints.min.z),
			new Vector3(worldBoundingPoints.min.x, worldBoundingPoints.max.y, worldBoundingPoints.min.z),
			worldBoundingPoints.min,
			new Vector3(worldBoundingPoints.min.x, worldBoundingPoints.min.y, worldBoundingPoints.max.z),
			new Vector3(worldBoundingPoints.min.x, worldBoundingPoints.max.y, worldBoundingPoints.max.z),
			new Vector3(worldBoundingPoints.min.x, worldBoundingPoints.max.y, worldBoundingPoints.min.z),
			new Vector3(worldBoundingPoints.min.x, worldBoundingPoints.max.y, worldBoundingPoints.max.z),
			worldBoundingPoints.max,
			new Vector3(worldBoundingPoints.max.x, worldBoundingPoints.max.y, worldBoundingPoints.min.z),
			new Vector3(worldBoundingPoints.max.x, worldBoundingPoints.min.y, worldBoundingPoints.min.z),
			new Vector3(worldBoundingPoints.max.x, worldBoundingPoints.min.y, worldBoundingPoints.max.z),
			new Vector3(worldBoundingPoints.min.x, worldBoundingPoints.min.y, worldBoundingPoints.max.z)
		]}, this.node!.getScene());
		line.color = Color3.Blue();
		const	sphere = MeshBuilder.CreateSphere("node sphere", {diameter: 10});
		sphere.setParent(this.node!);
		sphere.position = new Vector3(oX * minBoundingPoint.x, oY * minBoundingPoint.y, minBoundingPoint.z);
		*/
		if (distance) {
			this.node!.position = ray.origin.add(ray.direction.scale(distance)).subtractFromFloats(oX * minBoundingPoint.x, oY * minBoundingPoint.y, minBoundingPoint.z);
		}
	}
}