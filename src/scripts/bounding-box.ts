import { AbstractMesh, BoundingInfo, Color3, InstancedMesh, LinesMesh, Matrix, MeshBuilder, Scene, TmpVectors, Vector3 } from "@babylonjs/core";

export function	drawBoundingBox(name: string, scene: Scene, color: Color3, min: Vector3, max: Vector3): LinesMesh {
	const	aXiYiZ:	Vector3 = new Vector3(max.x, min.y, min.z);
	const	aXaYiZ:	Vector3 = new Vector3(max.x, max.y, min.z);
	const	iXaYiZ:	Vector3 = new Vector3(min.x, max.y, min.z);
	const	iXiYaZ:	Vector3 = new Vector3(min.x, min.y, max.z);
	const	iXaYaZ:	Vector3 = new Vector3(min.x, max.y, max.z);
	const	line:	LinesMesh = MeshBuilder.CreateLines(name + " bounding box", {points: [
		min,
		aXiYiZ,
		aXaYiZ,
		iXaYiZ,
		min,
		iXiYaZ,
		iXaYaZ,
		iXaYiZ,
		iXaYaZ,
		max,
		aXaYiZ,
		aXiYiZ,
		new Vector3(max.x, min.y, max.z),
		iXiYaZ
	]}, scene);
	line.color = color;
	return line;
}

export function	updateBoundingBoxRecursively(mesh: AbstractMesh):	void {
	const	children:	AbstractMesh[] = mesh.getChildMeshes(false, (n) => n instanceof AbstractMesh && n.isEnabled() && n.isVisible);
	if (children.length > 0) {
		if (mesh instanceof InstancedMesh) {
			const	v:	{min: Vector3, max: Vector3} = mesh.getHierarchyBoundingVectors();
			const	worldToMesh:	Matrix = Matrix.Invert(mesh.getWorldMatrix());
			const	center:	Vector3 = Vector3.TransformCoordinates(v.max.add(v.min).scaleInPlace(0.5), worldToMesh);
			mesh.getBoundingInfo().centerOn(center, mesh.sourceMesh.getBoundingInfo().boundingBox.extendSize);
		} else {
			const	worldToMesh:	Matrix = Matrix.Invert(mesh.getWorldMatrix());
			const	min:			Vector3 = mesh.getRawBoundingInfo().boundingBox.minimum;
			const	max:			Vector3 = mesh.getRawBoundingInfo().boundingBox.maximum;
			for (let i = 0; i < children.length; i += 1) {
				children[i].getWorldMatrix().multiplyToRef(worldToMesh, TmpVectors.Matrix[0]);
				const	meshMin:	Vector3 =  Vector3.TransformCoordinates(children[i].getRawBoundingInfo().boundingBox.minimum, TmpVectors.Matrix[0]);
				const	meshMax:	Vector3 =  Vector3.TransformCoordinates(children[i].getRawBoundingInfo().boundingBox.maximum, TmpVectors.Matrix[0]);
				min.minimizeInPlace(meshMin);
				max.maximizeInPlace(meshMax);
			}
			mesh.setBoundingInfo(new BoundingInfo(min, max));
		}
	}
}
