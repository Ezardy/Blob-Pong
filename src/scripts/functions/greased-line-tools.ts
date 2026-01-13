import { AbstractMesh, FloatArray, GreasedLineTools, IndicesArray, Vector3 } from "@babylonjs/core";

export function omitDuplicateWrapper(p1: Vector3, p2: Vector3, p3: Vector3, points: Vector3[][],
						indiceIndex: number, vertexIndex: number, mesh: AbstractMesh,
						meshIndex: number, vertices: FloatArray, indices: IndicesArray):	Vector3[][] {
		return GreasedLineTools.OmitDuplicatesPredicate(p1, p2, p3, points) || [];
}