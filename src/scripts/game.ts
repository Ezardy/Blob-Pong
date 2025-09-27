import { AbstractMesh, BoundingBox, BoundingSphere, Camera, Color3, CreateGreasedLine, FloatArray, GlowLayer, GreasedLineBaseMesh, GreasedLineMesh, GreasedLineMeshMaterialType, GreasedLineRibbonMesh, GreasedLineTools, IndicesArray, InstancedMesh, int, Mesh, NodeMaterial, Nullable, PBRMaterial, Scene, Vector3 } from "@babylonjs/core";
import WebApi from "./web-api";
import { getScriptByClassForObject, IScript, visibleAsColor3, visibleAsEntity, visibleAsNumber } from "babylonjs-editor-tools";

export default class Game implements IScript {
	public static readonly	NONE_MODE:	int = 0;
	public static readonly	LOBBY_MODE:	int = 1;
	public static readonly	GAME_MODE:	int = 2;

	@visibleAsNumber("distance from camera", {min: 0})
	private readonly	_distance:	number = 500;
	@visibleAsNumber("padding", {min: 0, max: 1})
	private readonly	_padding:	number = 0.1;
	@visibleAsColor3("wall color")
	private readonly	_wallColor:	Color3 = new Color3(89, 89, 89);
	@visibleAsNumber("racket size", {description: "percentage of wall size", min: 1, max: 100})
	private readonly	_racketSize:	number = 20;
	@visibleAsNumber("ball size", {description: "percentage of wall size", min: 1, max: 100})
	private readonly	_ballSize:	number = 1.6;

	private	_webApi!:	WebApi;

	private				_playerCount:	int = -1;
	private readonly	_playerColors:	Map<string, Color3> = new Map();
	private readonly	_playerRackets:	Map<string, InstancedMesh> = new Map();
	private readonly	_racketPool:	Array<InstancedMesh> = [];
	private readonly	_colorPool:		Array<Color3> = [];

	private	_field!:	GreasedLineBaseMesh;
	private	_ball!:		GreasedLineBaseMesh;

	private	_z:					number = 0;
	private	_y:					number = 1;
	private	_racketMeshSize:	number = 1;
	private	_ballMeshSize:		number = 1;

	@visibleAsEntity("node", "racket mesh")
	private readonly	_racketMesh!:	Mesh;
	@visibleAsEntity("node", "ball mesh")
	private readonly	_ballMesh!:	Mesh;

	private	_mode:	int = 0;

	private readonly	_glow:	GlowLayer;

	public constructor(public scene: Scene) {
		for (let i = 0; i < 16; i += 1)
			this._colorPool.push(Color3.Random());
		this._glow = new GlowLayer("glow", scene, {blurKernelSize: 128});
		this._glow.intensity = 1.2;
	}

	public onStart(): void {
		const	bb:	BoundingBox = this._racketMesh.getBoundingInfo().boundingBox;
		const	pivot = bb.center.clone();
		pivot.y = bb.maximum.y;
		this._racketMesh.setPivotPoint(pivot);
		this._racketMeshSize = bb.extendSize.x * 2;
		for (let i = 0; i < 16; i += 1) {
			const inst:	InstancedMesh = this._racketMesh.createInstance("racket " + i);
			this._racketPool.push(inst);
		}
		const	bbs:	BoundingSphere = this._ballMesh.getBoundingInfo().boundingSphere;
		this._ballMeshSize = bbs.radius * 2;
		const	lines:	Vector3[][] = GreasedLineTools.MeshesToLines([this._ballMesh], Game._omitDuplicateWrapper);
		this._ball = CreateGreasedLine("ball", {points: lines}, {
			color: Color3.White(),
			sizeAttenuation: true,
			width: 1,
			materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE
		});
		this._webApi = getScriptByClassForObject(this.scene, WebApi)!;
		const	camera:	Camera = this.scene.activeCamera!;
		this._z = camera.globalPosition.z - this._distance;
		this._y = this._z * Math.tan(camera.fov / 2) * this._padding;
	}

	public onUpdate(): void {
	}

	private	_drawField(playerCount: int):	void {
		let	points:	Vector3[];
		let	colors:	Color3[];
		if (this._playerCount > 2) {
			points = GreasedLineTools.GetCircleLinePoints(this._y, playerCount, this._z);
			colors = Array.from(this._playerColors.values());
		} else {
			const	x:		number = this._y * 2.2;
			const	start:	Vector3 = new Vector3(x, this._y, this._z);
			points = [
				start, new Vector3(x, -this._y, this._z), new Vector3(-x, -this._y, this._z),
				new Vector3(-x, this._y, this._z), start
			];
			const	colorIter:	MapIterator<Color3> = this._playerColors.values();
			const	color1:	Color3 = colorIter.next().value!;
			const	color2:	Color3 = colorIter.next().value!;
			colors = [
				color2, this._wallColor,
				color1, this._wallColor
			];
		}
		this._field = CreateGreasedLine("field", {
				points: points
			}, {
				useColors: true,
				colors: colors,
				useDash: true,
				dashCount: 15,
				materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE
				});
	}

	public get	mode():	int {
		return this._mode;
	}

	public set	mode(value: int) {
		if (value != this._mode && (value > this._mode || value == Game.NONE_MODE)) {
			switch (value) {
				case 0:
					this._glow.unReferenceMeshFromUsingItsOwnMaterial(this._field);
					this._glow.unReferenceMeshFromUsingItsOwnMaterial(this._ball);
					this._field.dispose(false, true);
					this._playerColors.clear();
					const	it:	MapIterator<string> = this._playerRackets.keys();
					let		str:	IteratorResult<string | undefined> = it.next();
					while (!str.done) {
						this._colorPool.push(this._playerColors.get(str.value!)!);
						this._playerColors.delete(str.value!);
						this._racketPool.push(this._playerRackets.get(str.value!)!);
						this._playerRackets.delete(str.value!);
						str = it.next();
					}
					break;
				case 1:
					this._drawField(this._webApi.serverGame.ro);
			}
		}
	}

	private static	_omitDuplicateWrapper(p1: Vector3, p2: Vector3, p3: Vector3, points: Vector3[][],
						indiceIndex: number, vertexIndex: number, mesh: AbstractMesh,
						meshIndex: number, vertices: FloatArray, indices: IndicesArray):	Vector3[][] {
		return GreasedLineTools.OmitDuplicatesPredicate(p1, p2, p3, points) || [];
	}

	drawArena(ctx: any, canvas: any) {
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 300;

		// Check if we're in 2-player mode for square arena
		// if (this.gameState && this.gameState.players && this.gameState.players.length === 2) {
			// Draw square arena for 2-player mode
			ctx.strokeStyle = '#00ff00';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.rect(centerX - radius, centerY - radius * 0.5, radius * 2, radius);
			ctx.stroke();
		// } else {
			// Draw circular arena for multi-player mode
			ctx.strokeStyle = '#00ff00';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
			ctx.stroke();

		// Draw center dot
		ctx.fillStyle = '#00ff00';
		ctx.beginPath();
		ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
		ctx.fill();
	}

	drawBall(ctx: any, canvas: any, ballPos: any) {
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 300;

		const ballX = centerX + ballPos[0] * radius;
		const ballY = centerY + ballPos[1] * radius;

		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
		ctx.fill();
	}

	drawPlayers(ctx: any, canvas: any, players: any) {
		if (!players || players.length === 0) {
			console.log('No players to draw');
			return;
		}

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 300;

		// Special case for 2 players - use left/right virtual positions (x = -1 and x = 1)
		if (players.length === 2) {
			const paddleWidth = 0.1;
			
			players.forEach((player: any, index: any) => {
				// Apply server-side logic: calculateTwoPlayersPositions
				const playerDist = player.position - 0.5;
				let virtualX, virtualY;
				
				if (index === 0) {
					// Left player
					virtualX = -1;
					virtualY = playerDist;
				} else {
					// Right player
					virtualX = 1;
					virtualY = playerDist;
				}

				// Map virtual coords to screen (paddle center)
				const screenX = centerX + virtualX * radius;
				const screenY = centerY + virtualY * radius;

				// Calculate paddle endpoints (vertical paddle)
				const paddleHalfLength = paddleWidth * radius;
				const leftX = screenX;
				const leftY = screenY - paddleHalfLength;
				const rightX = screenX;
				const rightY = screenY + paddleHalfLength;
				
				// Draw paddle using moveTo/lineTo pattern
				ctx.strokeStyle = player.isActive ? '#00ff00' : '#ff4444';
				ctx.lineWidth = 6;
				ctx.beginPath();
				ctx.moveTo(leftX, leftY);
				ctx.lineTo(rightX, rightY);
				ctx.stroke();

				// Draw player name
				ctx.fillStyle = player.isActive ? '#00ff00' : '#ff4444';
				ctx.font = '12px Courier New';
				ctx.textAlign = 'center';
				ctx.fillText(player.username, screenX, screenY - paddleHalfLength - 10);
			});
			return;
		}

		// Original multi-player circular arrangement
		const playerCount = players.length;
		const alpha = (Math.PI * 2) / playerCount;
		const height = 0.5 / Math.tan(alpha / 2);
		const paddleWidth = 0.1;

		players.forEach((player: any, index: number) => {
			const beta = alpha * index;
			const gamma = beta - (Math.PI / 2);

			// Calculate paddle position
			const distance = player.position - 0.5;
			const distance_x = distance * Math.cos(beta);
			const distance_y = distance * Math.sin(beta);
			const x_center = height * Math.cos(gamma);
			const y_center = height * Math.sin(gamma);
			const paddleX = x_center + distance_x;
			const paddleY = y_center + distance_y;

			// Draw paddle
			const screenX = centerX + paddleX * radius;
			const screenY = centerY + paddleY * radius;

			const leftX = screenX - paddleWidth * Math.cos(beta) * radius;
			const leftY = screenY - paddleWidth * Math.sin(beta) * radius;
			const rightX = screenX + paddleWidth * Math.cos(beta) * radius;
			const rightY = screenY + paddleWidth * Math.sin(beta) * radius;

			ctx.strokeStyle = player.isActive ? '#00ff00' : '#ff4444';
			ctx.lineWidth = 6;
			ctx.beginPath();
			ctx.moveTo(leftX, leftY);
			ctx.lineTo(rightX, rightY);
			ctx.stroke();

			// Draw player name
			ctx.fillStyle = player.isActive ? '#00ff00' : '#ff4444';
			ctx.font = '12px Courier New';
			ctx.textAlign = 'center';
			ctx.fillText(player.username, screenX, screenY - 20);
		});
	}

	/** mousemove event listener
	this.canvas.addEventListener('mousemove', (e) => {
		const rect = this.canvas.getBoundingClientRect();
		const newMouseX = (e.clientX - rect.left) / rect.width;

		// Calculate drag delta
		const dragDelta = newMouseX - this.mouseX;
		this.mouseX = newMouseX;

		// Only send input if game is in playing state
		if (!this.gameState || this.gameState.state !== 'playing') {
			return;
		}
	**/

	// 	// Only send if game WebSocket is ready and delta is meaningful
	// 	if (this.gameWs && this.gameWs.readyState === WebSocket.OPEN && Math.abs(dragDelta) > 0.001) {
	// 		// Send drag delta (scaled for sensitivity)
	// 		if (this.gameState.players.length == 2)
	// 			this.gameWs.send((dragDelta * 1000).toString());
	// 		else
	// 			this.gameWs.send((dragDelta * 500).toString());
	// 	}
	// });

	// renderGame() {
	// 	const ctx = this.ctx;
	// 	const canvas = this.canvas;
		
	// 	// Clear canvas
	// 	ctx.fillStyle = '#000';
	// 	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// 	if (!this.gameState) {
	// 		// Draw empty arena
	// 		this.drawArena(ctx, canvas);
	// 		return;
	// 	}

	// 	// Draw arena
	// 	this.drawArena(ctx, canvas);

	// 	// Draw ball
	// 	if (this.gameState.ballPosition) {
	// 		this.drawBall(ctx, canvas, this.gameState.ballPosition);
	// 	}

	// 	// Draw players
	// 	if (this.gameState.players) {
	// 		this.drawPlayers(ctx, canvas, this.gameState.players);
	// 	}
	// }
}


