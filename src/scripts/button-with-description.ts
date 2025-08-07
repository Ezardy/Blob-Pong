import { Mesh, Quaternion, Animation as BAnimation } from "@babylonjs/core";
import { MeshButton3D } from "@babylonjs/gui";

export default class ButtonWithDescription extends MeshButton3D {
	public constructor(mesh: Mesh, name: string, descriptionRotation: Quaternion) {
		super(mesh, name);
		const	initialRotation:		Quaternion = mesh.rotationQuaternion!;
		const	endRotation:			Quaternion = initialRotation.multiply(descriptionRotation);
		const	descriptionAnimation:	BAnimation = new BAnimation(name + "_description_animation", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT, false);
		const	keys:					{frame: number; value: Quaternion;}[] = [
			{
				frame:	0,
				value:	initialRotation
			},
			{
				frame:	5,
				value:	endRotation
			}
		];
		descriptionAnimation.setKeys(keys);
		this.pointerEnterAnimation = () => mesh.getScene().beginDirectAnimation(mesh, [descriptionAnimation], 0, 5);
		this.pointerOutAnimation = () => mesh.getScene().beginDirectAnimation(mesh, [descriptionAnimation], 5, 0, false, -1);
	}
}
