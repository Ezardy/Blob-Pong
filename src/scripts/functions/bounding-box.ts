import { AbstractMesh, BoundingBox, BoundingInfo, Color3, InstancedMesh, LinesMesh, Matrix, MeshBuilder, Scene, TmpVectors, Vector3 } from "@babylonjs/core";

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
	const	children:	AbstractMesh[] = mesh.getChildMeshes(true, (n) => n instanceof AbstractMesh && n.isEnabled() && n.isVisible);
	for (const mesh of children)
		updateBoundingBoxRecursively(mesh);
	if (children.length > 0) {
		if (mesh instanceof InstancedMesh) {
			const	v:	{min: Vector3, max: Vector3} = mesh.getHierarchyBoundingVectors();
			const	worldToMesh:	Matrix = mesh.getWorldMatrix().invertToRef(TmpVectors.Matrix[0]);
			const	center:	Vector3 = Vector3.TransformCoordinates(v.max.add(v.min).scaleInPlace(0.5), worldToMesh);
			mesh.getBoundingInfo().centerOn(center, mesh.sourceMesh.getBoundingInfo().boundingBox.extendSize);
		} else {
			const	worldToMesh:	Matrix = mesh.getWorldMatrix().invertToRef(TmpVectors.Matrix[1]);
			const	min:			Vector3 = mesh.getRawBoundingInfo().boundingBox.minimum;
			const	max:			Vector3 = mesh.getRawBoundingInfo().boundingBox.maximum;
			for (const child of children) {
				const	bb:				BoundingBox = child.getRawBoundingInfo().boundingBox;
				const	localMeshMin:	Vector3 = TmpVectors.Vector3[0].copyFrom(bb.minimum);
				const	localMeshMax:	Vector3 = TmpVectors.Vector3[7].copyFrom(bb.maximum);
				TmpVectors.Vector3[1].set(localMeshMax.x, localMeshMin.y, localMeshMin.z);
				TmpVectors.Vector3[2].set(localMeshMax.x, localMeshMin.y, localMeshMax.z);
				TmpVectors.Vector3[3].set(localMeshMin.x, localMeshMin.y, localMeshMax.z);
				TmpVectors.Vector3[4].set(localMeshMin.x, localMeshMax.y, localMeshMax.z);
				TmpVectors.Vector3[5].set(localMeshMin.x, localMeshMax.y, localMeshMin.z);
				TmpVectors.Vector3[6].set(localMeshMax.x, localMeshMax.y, localMeshMin.z);
				const	childToMesh:	Matrix = child.getWorldMatrix().multiplyToRef(worldToMesh, TmpVectors.Matrix[0]);
				for (let i = 0; i < 8; i += 1) {
					const	corner:	Vector3 = Vector3.TransformCoordinates(TmpVectors.Vector3[i], childToMesh);
					min.minimizeInPlace(corner);
					max.maximizeInPlace(corner);
				}
			}
			mesh.setBoundingInfo(new BoundingInfo(min, max, mesh.getWorldMatrix()));
		}
	}
}
