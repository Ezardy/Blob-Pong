import { EventState, PointerEventTypes, PointerInfo, Scene, Vector3 } from "@babylonjs/core";
import { StackPanel3D } from "@babylonjs/gui";

export default class ScrollViewer3D extends StackPanel3D {
	private	_scrollVector:	Vector3 = Vector3.Zero();

	constructor(isVertical: boolean) {
		super(isVertical);
		this.node?.getScene().onPointerObservable.add();
	}

	public override get	isVisible():	boolean { return this._isVisible}
	public override set	isVisible(value: boolean) {
		this._isVisible = value;
		if (value)
			this.node?.getScene().onPointerObservable.add(this._scrollCallback);
		else
			this.node?.getScene().onPointerObservable.removeCallback(this._scrollCallback);
	}

	private	_scrollCallback(info: PointerInfo, state: EventState) {
		if (info.type == PointerEventTypes.POINTERWHEEL) {
			const	deltaVector:	Vector3 = new Vector3(this.isVertical ? 0 : info.event.movementY, this.isVertical ? info.event.movementY : 0, 0);
			this._scrollVector.addInPlace(deltaVector);
			for (const control of this.children) {
				control.position.addInPlace(deltaVector);
			}
		}
	}
}
