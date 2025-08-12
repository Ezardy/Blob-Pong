import { Camera, int, Matrix, TmpVectors, Tools, Vector3 } from "@babylonjs/core";
import { Container3D, Control3D } from "@babylonjs/gui";

export class AdvancedStackPanel3D extends Container3D {
	public static readonly	START_ALIGNMENT = 1;
	public static readonly	END_ALIGNMENT = 2;
	public static readonly	CENTER_ALIGNMENT = 0;

	private				_isVertical:	boolean;
	private				_alignment:		int;

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
		let controlCount = 0;
		const extendSizes: {[key: int]: Vector3} = {};

		const	currentInverseWorld = Matrix.Invert(this.node!.computeWorldMatrix(true));

		// Measure
		for (const child of this._children) {
			if (child.mesh) {
				child.mesh.computeWorldMatrix(true);
				child.mesh.getWorldMatrix().multiplyToRef(currentInverseWorld, TmpVectors.Matrix[0]);
				const boundingBox = child.mesh.getBoundingInfo().boundingBox;
				const extendSize = Vector3.TransformNormal(boundingBox.extendSize, TmpVectors.Matrix[0]);
				extendSizes[controlCount] = extendSize;
				if (this._isVertical)
					height += extendSize.y;
				else
					width += extendSize.x;
			} else if (child.node) {
				child.node.computeWorldMatrix(true);
				child.node.getWorldMatrix().multiplyToRef(currentInverseWorld, TmpVectors.Matrix[0]);
				const	boundingVectors:	Vector3 = child.node.getHierarchyBoundingVectors().max;
				const	extendSize:	Vector3 = boundingVectors.x == -Number.MAX_VALUE || boundingVectors.y == -Number.MAX_VALUE || boundingVectors.z == -Number.MAX_VALUE ? Vector3.Zero() : Vector3.TransformNormal(boundingVectors, TmpVectors.Matrix[0]);
				extendSizes[controlCount] = extendSize;
				if (this._isVertical)
					height += extendSize.y;
				else
					width += extendSize.x;
			}
			controlCount++;
		}

		if (this._isVertical) {
			height += ((controlCount - 1) * this.margin) / 2;
		} else {
			width += ((controlCount - 1) * this.margin) / 2;
		}

		// Arrange
		let _offset: number = 0;
		const	lastControlIndex:	int = this.children.findLastIndex((c) => c.node);
		if (this._alignment == 0) {
			if (this._isVertical)
				_offset = -height;
			else
				_offset = -width;
		} else if (lastControlIndex > -1) {
			const	camera:	Camera = this.children[lastControlIndex].node?.getScene().activeCamera!;
			const	camZ:	number = Vector3.TransformCoordinates(camera.globalPosition, currentInverseWorld).z;
			let	heightScaler:	number = 1;
			let	widthScaler:	number = 1;
			if (screen.availHeight > screen.availWidth)
				heightScaler = screen.availHeight / screen.availWidth;
			else
				widthScaler = screen.availWidth / screen.availHeight;
			if (this._alignment == AdvancedStackPanel3D.START_ALIGNMENT) {
				if (lastControlIndex > -1) {
					const	control:	Control3D = this.children[lastControlIndex];
					const	nZ:	number = Math.abs(camZ - (control.node!.position.z ? control.node!.position.z * (1 + extendSizes[lastControlIndex].z / Math.abs(control.node!.position.z)) : 0));
					_offset = nZ * Math.tan(camera.fov / 2) * (this._isVertical ? heightScaler : widthScaler) - (this._isVertical ? height : width) * 2 - this.offset;
				}
			} else {
				const	firstControlIndex:	number = this.children.findIndex((c) => c.node);
				if (firstControlIndex > -1) {
					const	control:	Control3D = this.children[firstControlIndex];
					const	nZ:	number = Math.abs(camZ - (control.mesh ? control.mesh.position.z : control.node!.position.z));
					_offset = -nZ * Math.tan(camera.fov / 2) * (this._isVertical ? heightScaler : widthScaler) + this.offset;
				}
			}
		}

		let index = 0;
		for (const child of this._children) {
			if (child.mesh || child.node) {
				controlCount--;
				const extendSize = extendSizes[index++];

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
		}
	}
}