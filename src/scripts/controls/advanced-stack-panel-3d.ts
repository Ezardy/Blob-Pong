import { AbstractEngine, Camera, int, Matrix, Nullable, Plane, Ray, Scene, TmpVectors, Tools, Vector3 } from "@babylonjs/core";
import { Container3D } from "@babylonjs/gui";
import { _applyScriptsForObject, getScriptByClassForObject } from "babylonjs-editor-tools";
import { IClonableControl3D, isclonablecontrol3d } from "../interfaces/iclonablecontrol3d";
import IconDrawer from "../icon-drawer";
import { Control3DClone } from "../functions/typing-utils";

export class AdvancedStackPanel3D extends Container3D implements IClonableControl3D {
	public static readonly	START_ALIGNMENT = 1;
	public static readonly	END_ALIGNMENT = 2;
	public static readonly	CENTER_ALIGNMENT = 0;

	private		_isVertical:	boolean;
	private		_alignment:		int;
	private		_isArrangable:	boolean = true;
	protected	_extendSizes:	Map<int, Vector3> = new Map();

	public get	isArrangable():	boolean {
		return this._isArrangable;
	}

	public set	isArrangable(value: boolean) {
		if (value != this._isArrangable) {
			this._isArrangable = value;
			this.parent?.updateLayout();
		}
	}

	public get	isVertical():	boolean {
		return this._isVertical;
	}

	public set	isVertical(value: boolean) {
		if (this._isVertical === value) {
			return;
		}

		this._isVertical = value;

		Tools.SetImmediate(() => {
			this._arrangeChildren();
		});
	}

	public	margin:		number = 0.1;
	public	padding:	number = 0;
	public	shift:		number = 0;

	public constructor(isVertical: boolean = false, alignment: int = 0) {
		super();

		this._isVertical = isVertical;
		this._alignment = alignment;
	}

	protected override _arrangeChildren() {
		this.node?.position.setAll(0);
		let width = 0;
		let height = 0;
		let index = 0;
		this._extendSizes.clear();

		const	currentInverseWorld = Matrix.Invert(this.node!.computeWorldMatrix(true));

		for (const child of this._children) {
			if ((!(child instanceof AdvancedStackPanel3D) || child.isArrangable) && child.node && child.isVisible) {
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
					this._positionNode(0.5 + this.shift, this.padding, 0, -1, currentInverseWorld);
				else
					this._positionNode(this.padding, 0.5 + this.shift, 1, 0, currentInverseWorld);
			} else {
				if (this._isVertical)
					this._positionNode(0.5 + this.shift, 1 - this.padding, 0, 1, currentInverseWorld);
				else
					this._positionNode(1 - this.padding, 0.5 + this.shift, -1, 0, currentInverseWorld);
			}
		}
	}

	private	_positionNode(pX: number, pY: number, oX: number, oY: number, nodeInverseWorld: Matrix):	void {
		const	worldBoundingPoints:	{min: Vector3, max: Vector3} = this.node!.getHierarchyBoundingVectors(true, (am) => am && am.isVisible && am.isEnabled());
		const	minBoundingPoint:		Vector3 = Vector3.TransformCoordinates(worldBoundingPoints.min, nodeInverseWorld);
		const	scene:					Scene = this.node!.getScene();
		const	camera:					Camera = scene.activeCamera!;
		const	engine:					AbstractEngine = scene.getEngine();
		const	rect = engine.getRenderingCanvasClientRect()!;
		const	ray:					Ray = scene.createPickingRay(rect.width * pX, rect.height * pY, this.node!.getWorldMatrix(), camera);
		const	plane:					Plane = Plane.FromPositionAndNormal(minBoundingPoint, new Vector3(0, 0, -1));
		const	distance:				Nullable<number> = ray.intersectsPlane(plane);

		if (distance)
			this.node!.position = ray.origin.add(ray.direction.scale(distance)).subtractFromFloats(oX * minBoundingPoint.x, oY * minBoundingPoint.y, minBoundingPoint.z);
	}

	public override set	isVisible(value: boolean) {
		if (this._isVisible != value) {
			this._isVisible = value;
			for (const child of this.children) {
				child.isVisible = value;
				if (value && child.mesh) {
					getScriptByClassForObject(child.mesh, IconDrawer)?.render();
					for (const childOfChild of child.mesh.getChildMeshes())
						getScriptByClassForObject(childOfChild, IconDrawer)?.render();
				}
			}
		}
	}

	public override get	isVisible():	boolean {
		return this._isVisible;
	}

	public	clone():	Control3DClone {
		const	c:	AdvancedStackPanel3D = new AdvancedStackPanel3D(this._isVertical, this._alignment);
		c.margin = this.margin;
		c.padding = this.padding;
		const	children:	Control3DClone[] = [];
		for (const child of this.children) {
			if (isclonablecontrol3d(child))
				children.push(child.clone());
		}
		return {root: c, children: children};
	}
}