import { AbstractMesh, Axis, BoundingBox, BoundingSphere, Camera, Color3, CreateGreasedLine, FloatArray, GlowLayer, GreasedLineBaseMesh, GreasedLineMesh, GreasedLineMeshColorDistribution, GreasedLineMeshColorDistributionType, GreasedLineMeshMaterialType, GreasedLineTools, IndicesArray, InstancedMesh, int, Mesh, Nullable, PointerEventTypes, PointerInfo, Quaternion, Scene, Vector2, Vector3 } from "@babylonjs/core";
import WebApi from "./web-api";
import { getScriptByClassForObject, IScript, visibleAsColor3, visibleAsEntity, visibleAsNumber } from "babylonjs-editor-tools";
import { GamePlayer, GameState, RoomDetails } from "./web-api/server-game";

export default class Game implements IScript {
	public static readonly	NONE_MODE:	int = 0;
	public static readonly	LOBBY_MODE:	int = 1;
	public static readonly	GAME_MODE:	int = 2;

	private static readonly	_rectRot:	Quaternion = Quaternion.RotationAxis(Axis.Z, Math.PI);
	private static readonly	_colors:	Array<Color3> = [
		new Color3(230 / 255, 25 / 255, 75 / 255), new Color3(60 / 255, 180 / 255, 75 / 255), new Color3(255 / 255, 225 / 255, 25 / 255),
		new Color3(0 / 255, 130 / 255, 200 / 255), new Color3(245 / 255, 130 / 255, 48 / 255), new Color3(145 / 255, 30 / 255, 180 / 255),
		new Color3(70 / 255, 240 / 255, 240 / 255), new Color3(240 / 255, 50 / 255, 230 / 255), new Color3(210 / 255, 245 / 255, 60 / 255),
		new Color3(0 / 255, 128 / 255, 128 / 255), new Color3(220 / 255, 190 / 255, 255 / 255),
		new Color3(170 / 255, 110 / 255, 40 / 255), new Color3(255 / 255, 250 / 255, 200 / 255), new Color3(128 / 255, 0 / 255, 0 / 255),
		new Color3(170 / 255, 255 / 255, 195 / 255), new Color3(128 / 255, 128 / 255, 0 / 255), new Color3(255 / 255, 215 / 255, 180 / 255),
		new Color3(0 / 255, 0 / 255, 128 / 255), new Color3(128 / 255, 128 / 255, 128 / 255)];

	// game parameters
	@visibleAsNumber("max players", {min: 2, max: 20, step: 1})
	public readonly	maxPlayers:	int = 10;
	@visibleAsNumber("min fee", {min: 0.0001})
	public readonly	minFee:	number = 1;
	@visibleAsNumber("max fee", {min: 0.0001})
	public readonly	maxFee:	number = 1000;
	@visibleAsNumber("countdown time", {min: 0, max: 10, step: 1})
	public readonly	countdownTime:	int = 3;

	@visibleAsNumber("distance from camera", {min: 0})
	private readonly	_distance:	number = 500;
	@visibleAsNumber("padding", {min: 0, max: 1})
	private readonly	_padding:	number = 0.1;
	@visibleAsColor3("wall color")
	private readonly	_wallColor:	Color3 = new Color3(0.4, 0.4, 0.4);
	@visibleAsNumber("racket size", {description: "percentage of wall size", min: 1, max: 100})
	private readonly	_racketSize:	number = 20;
	@visibleAsNumber("ball size", {description: "percentage of wall size", min: 1, max: 100})
	private readonly	_ballSize:	number = 1.6;
	@visibleAsNumber("rectangle ratio", {min: 1})
	private readonly	_rectangleRatio:	number = 2.2;

	private	_webApi!:	WebApi;

	private				_fields!:		Array<GreasedLineMesh>;
	private readonly	_playerColors:	Map<string, Color3> = new Map<string, Color3>();
	private readonly	_colorWalls:	Map<Color3, int> = new Map<Color3, int>();
	private readonly	_wallReadiness:	Map<int, boolean> = new Map<int, boolean>();
	private readonly	_playerRackets:	Map<string, InstancedMesh> = new Map<string, InstancedMesh>();
	private				_racketPool!:	Array<InstancedMesh>;
	private				_colorPool!:	Array<Color3>;

	private	_ball!:		GreasedLineBaseMesh;

	private	_z:					number = 0;
	private	_y:					number = 0;
	private	_ry:				number = 0;
	private	_shift:				int = 0;
	private	_racketMeshScales!:	Array<Vector3>;
	private	_ballMeshScales!:	Array<Vector3>;
	private	_wallSizes!:		Array<number>;
	private	_heights!:			Array<number>;
	private	_betaSins!:			Array<Array<number>>;
	private	_betaCoss!:			Array<Array<number>>;
	private	_rotations!:		Array<Array<Quaternion>>;

	@visibleAsEntity("node", "racket mesh")
	private readonly	_racketMesh!:	Mesh;
	@visibleAsEntity("node", "ball mesh")
	private readonly	_ballMesh!:	Mesh;

	private	_mode:			int = 0;
	private	_playerCount:	int = 2;

	private readonly	_glow:	GlowLayer;

	private	_drag:	number = 0;
	private readonly	_mouseCallback:	(info: PointerInfo) => void;

	public constructor(public scene: Scene) {
		// Rendering
		this._glow = new GlowLayer("glow", scene, {blurKernelSize: 128});
		this._glow.intensity = 1.2;
		this._mouseCallback = (info: PointerInfo) => {
			if (info.type == PointerEventTypes.POINTERMOVE) {
				const	rot:	Quaternion = Quaternion.Zero();
				const	y:		number = (this._playerCount <= 2 ? this._ry : this._y);
				const	move:	Vector3 = new Vector3(info.event.movementX, info.event.movementY, 0).scaleInPlace(this._wallSizes[this._playerCount - 2] / y / y / 4);
				let		dir:	Vector3;
				if (this._playerCount <= 2)
					dir = Vector3.Up();
				else {
					move.y *= -1;
					dir = Vector3.Right();
				}
				const	wallDir:	Vector3 = scene.activeCamera!.getDirection(dir);
				wallDir.z = 0;
				wallDir.normalize();
				Quaternion.FromUnitVectorsToRef(wallDir, dir, rot);
				move.applyRotationQuaternionInPlace(rot);
				this._drag = (this._playerCount <= 2 ? move.y : move.x);
			}
		};
	}

	public onStart(): void {
		// Initialization
		this._fields = new Array<GreasedLineMesh>(this.maxPlayers - 1);
		this._racketPool = new Array<InstancedMesh>(this.maxPlayers - 1);
		this._colorPool = new Array<Color3>(this.maxPlayers - 1);
		this._betaSins = new Array<Array<number>>(this.maxPlayers - 1);
		this._betaCoss = new Array<Array<number>>(this.maxPlayers - 1);
		this._rotations = new Array<Array<Quaternion>>(this.maxPlayers - 1);
		for (let i = 0; i < this._betaSins.length; i += 1) {
			this._betaSins[i] = new Array<number>(i + 2);
			this._betaCoss[i] = new Array<number>(i + 2);
			this._rotations[i] = new Array<Quaternion>(i + 2);
		}
		this._wallSizes = new Array<number>(this.maxPlayers - 1);
		this._heights = new Array<number>(this.maxPlayers - 1);
		this._racketMeshScales = new Array<Vector3>(this.maxPlayers - 1);
		this._ballMeshScales = new Array<Vector3>(this.maxPlayers - 1);
		// Web
		this._webApi = getScriptByClassForObject(this.scene, WebApi)!;
		this._webApi.serverGame.onRoomDetailsUpdatedObservable.add((d) => this._roomDetailsCallback(d));
		this._webApi.serverGame.onGameStateUpdatedObservable.add((gs) => this._gameUpdateCallback(gs));
		// Rendering
		const	camera:	Camera = this.scene.activeCamera!;
		this._z = camera.globalPosition.z + this._distance;
		this._y = this._distance * Math.tan(camera.fov / 2);
		const	rect = this.scene.getEngine().getRenderingCanvasClientRect()!;
		let		initHeight:	number = this._y * (1 - this._padding) * rect.width / rect.height;
		this._ry = initHeight / this._rectangleRatio;
		if (this._ry > this._y) {
			this._ry = this._y;
			initHeight = this._y * this._rectangleRatio;
		}
		const	initWallSize:	number = 2 * this._ry;
		this._heights[0] = initHeight;
		const	start:	Vector3 = new Vector3(initHeight, this._ry, this._z);
		this._fields[0] = this._createField([
				start, new Vector3(initHeight, -this._ry, this._z), new Vector3(-initHeight, -this._ry, this._z),
				new Vector3(-initHeight, this._ry, this._z), start], false);
		for (let i = 1; i < this._fields.length; i += 1)
			this._fields[i] = this._createField(GreasedLineTools.GetCircleLinePoints(i % 2 ? this._y : initHeight, i + 2, this._z), true);
		this._wallSizes[0] = initWallSize;
		const	wallWorldSize:	number = this._racketMesh.getBoundingInfo().boundingBox.extendSizeWorld.x * 2;
		this._racketMeshScales[0] = this._racketMesh.scaling.scale(initWallSize * this._racketSize / 100 / wallWorldSize);
		this._rotations[0][0] = Quaternion.RotationAxis(Axis.Z, -Math.PI / 2);
		this._rotations[0][1] = Quaternion.RotationAxis(Axis.Z, Math.PI / 2);
		const	lines:	Vector3[][] = GreasedLineTools.MeshesToLines([this._ballMesh], Game._omitDuplicateWrapper);
		this._ball = CreateGreasedLine("ball", {points: lines}, {
			color: Color3.White(),
			sizeAttenuation: true,
			width: 2,
			materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE
		});
		const	ballWorldSize:	number = this._ball.getBoundingInfo().boundingSphere.radiusWorld * 2;
		this._ballMeshScales[0] = this._ball.scaling.scale(initWallSize / 100 * this._ballSize / ballWorldSize);
		for (let i = 1; i < this._heights.length; i += 1) {
			const	playerCount:	int = i + 2;
			const	wallSize:		number = 2 * (i % 2 ? this._y : initHeight) * Math.cos(Math.PI / 2 - Math.PI / playerCount);
			this._wallSizes[i] = wallSize;
			this._heights[i] = wallSize / 2 / Math.tan(Math.PI/ playerCount);
			this._racketMeshScales[i] = this._racketMesh.scaling.scale(wallSize * this._racketSize / 100 / wallWorldSize);
			this._ballMeshScales[i] = this._ball.scaling.scale(wallSize * this._ballSize / 100 / ballWorldSize);
			for (let j = 0; j < playerCount; j += 1) {
				const	beta:	number = j * 2 * Math.PI / playerCount;
				this._betaSins[i][j] = Math.sin(beta);
				this._betaCoss[i][j] = Math.cos(beta);
				this._rotations[i][j] = Quaternion.RotationAxis(Axis.Z, beta);
			}
		}
		this._racketMesh.registerInstancedBuffer("instanceColor", 3);
		this._racketMesh.instancedBuffers.instanceColor = Color3.Random();
		this._racketMesh.isVisible = false;
		for (let i = 0; i < this.maxPlayers; i += 1) {
			const inst:	InstancedMesh = this._racketMesh.createInstance("racket " + i);
			inst.isVisible = false;
			this._racketPool[i] = inst;
		}
		this._glow.addIncludedOnlyMesh(this._ball);
		this._glow.referenceMeshToUseItsOwnMaterial(this._ball);
		this._ballMesh.isVisible = false;
		this._ball.isVisible = false;
		this.scene.onBeforeRenderObservable.add(() => this._fields[this._playerCount - 2].greasedLineMaterial!.dashOffset += 0.001);
	}

	private	_sendDrag():	void {
		if (this._drag) {
			this._webApi.serverGame.sendDragToServer(this._drag);
			this._drag = 0;
		}
	}

	private	_gameUpdateCallback(gs: GameState):	void {
		if (gs.players.length) {
			if (this._playerColors.size > gs.players.length)
				this._syncGame(gs.players);
			const	index:		int = gs.players.length - 2;
			const	wallSize:	number = this._wallSizes[index];
			const	ballPos:	Vector3 = new Vector3(gs.ballPosition[0] * wallSize, gs.ballPosition[1] * wallSize, this._z);
			if (gs.players.length <= 2) {
				if (this._shift) {
					ballPos.applyRotationQuaternionInPlace(Game._rectRot);
					gs.players.push(gs.players.shift()!);
				}
			} else
				ballPos.applyRotationQuaternionInPlace(this._rotations[index][(gs.players.length - this._shift) % gs.players.length]);
			this._ball.position.copyFrom(ballPos);
			this._drawPlayers(gs.players);
			if (gs.players.find((p) => p.id === this._webApi.clientInfo!.id))
				this._sendDrag();
		}
	}

	private	_roomDetailsCallback(d: RoomDetails):	void {
		const	gamePlayers:	GamePlayer[] = [];
		d.players.forEach(v => {
			const	gamePlayer:	GamePlayer = {
				id: v.id,
				username: v.username,
				position: 0.5
			}
			gamePlayers.push(gamePlayer);
		});
		this._syncRoomPlayers(gamePlayers);
		d.players.forEach((player) => this._wallReadiness.set(this._colorWalls.get(this._playerColors.get(player.id)!)!, player.isReady));
		this._colorizeField();
		this._drawPlayers(gamePlayers);
	}

	private	_drawPlayers(players: GamePlayer[]):	void {
		if (this._playerCount > 2) {
			for (const player of players) {
				const	color:		Color3 = this._playerColors.get(player.id)!;
				const	wall:		int = this._colorWalls.get(color)!;
				const	racket:		InstancedMesh = this._playerRackets.get(player.id)!;
				const	index:		int = this._playerCount - 2;
				const	wallSize:	number = this._wallSizes[index];
				const	height:		number = this._heights[index];
				const	sin:		number = this._betaSins[index][wall];
				const	cos:		number = this._betaCoss[index][wall];
				racket.position.set(height * sin + wallSize * (player.position - 0.5) * cos,
									-height * cos + wallSize * (player.position - 0.5) * sin,
									this._z);
				racket.rotationQuaternion = this._rotations[index][wall].multiply(Game._rectRot);
			}
		} else {
			const	color1:		Color3 = this._playerColors.get(players[0].id)!;
			const	wall1:		int = this._colorWalls.get(color1)!;
			const	racket1:	InstancedMesh = this._playerRackets.get(players[0].id)!;
			const	wallSize:	number = this._wallSizes[0];
			const	height:		number = this._heights[0];
			if (players.length > 1) {
				const	color2:		Color3 = this._playerColors.get(players[1].id)!;
				const	wall2:		int = this._colorWalls.get(color2)!;
				const	racket2:	InstancedMesh = this._playerRackets.get(players[1].id)!;
				racket2.position.set(height, (players[1].position - 0.5) * wallSize, this._z);
				racket2.rotationQuaternion = this._rotations[0][1 - wall2];
			}
			racket1.position.set(-height, (0.5 - players[0].position) * wallSize, this._z);
			racket1.rotationQuaternion = this._rotations[0][1 - wall1];
		}
	}

	private	_syncGame(players: GamePlayer[]):	void {
		this._playerCount = players.length;
		this._fields[this._playerColors.size - 2].isVisible = false;
		this._syncRoomPlayers(players);
		this._fields[players.length - 2].isVisible = true;
		this._colorizeField();
		this._scaleMeshes();
	}

	private	_syncRoomPlayers(players: GamePlayer[]):	void {
		const	playerColors:	Map<string, Color3> = new Map(this._playerColors);
		this._colorWalls.clear();
		let	j:	int;
		for (j = 0; j < players.length && players[0].id !== this._webApi.clientInfo!.id; j += 1, players.push(players.shift()!), this._colorPool.unshift(this._colorPool.pop()!));
		this._shift = j % players.length;
		const	func:	(index: int, wall: int, takeColor:	() => Color3 | undefined) => void = (index, wall, takeColor) => {
			const	player:	GamePlayer = players[index];
			if (this._playerColors.has(player.id)) {
				this._colorWalls.set(this._playerColors.get(player.id)!, wall);
				playerColors.delete(player.id);
			} else {
				const	color:	Color3 = takeColor()!;
				const	racket:	InstancedMesh = this._racketPool.pop()!;
				racket.isVisible = true;
				racket.instancedBuffers.instanceColor = color;
				this._colorWalls.set(color, wall);
				this._playerRackets.set(player.id, racket);
				this._playerColors.set(player.id, color);
			}
		};
		j = players.length - this._shift;
		for (let i = 0; i < j; i += 1)
			func(i, i, () => this._colorPool.pop());
		let	k:	int = this._playerCount - this._shift;
		for (let i = j; i < players.length; i += 1, k += 1)
			func(i, k, () => this._colorPool.shift());
		playerColors.forEach((color, id) => {
			const	racket:	InstancedMesh = this._playerRackets.get(id)!;
			racket.isVisible = false;
			this._playerRackets.delete(id);
			this._playerColors.delete(id);
			this._racketPool.unshift(racket);
			this._colorPool.unshift(color);
		});
	}

	public get	playerCount():	int {
		return this._playerCount;
	}

	public set	playerCount(value: int) {
		if (!this._mode && value > 1 && value <= this.maxPlayers) {
			this._playerCount = value;
		}
	}

	public get	mode():	int {
		return this._mode;
	}

	public set	mode(value: int) {
		if (value != this._mode && (value > this._mode || value == Game.NONE_MODE)) {
			switch (value) {
				case 0:
					if (this._mode === 1)
						this._webApi.serverGame.unsubscribeFromRoom();
					else {
						this._webApi.serverGame.unsubscribeFromGame();
						this.scene.onPointerObservable.removeCallback(this._mouseCallback);
						this._ball.isVisible = false;
					}
					this._colorWalls.clear();
					this._playerColors.forEach((_, id) => {
						const	racket:	InstancedMesh = this._playerRackets.get(id)!;
						racket.isVisible = false;
						this._racketPool.push(racket);
					});
					this._playerColors.clear();
					this._playerRackets.clear();
					this._fields[this._playerCount - 2].isVisible = false;
					break;
				case 1:
					for (let i = 0; i < this.maxPlayers; i += 1)
						this._colorPool[this.maxPlayers - i - 1] = Game._colors[i];
					this._scaleMeshes();
					this._fields[this._playerCount - 2].isVisible = true;
					break;
				default:
					this.scene.onPointerObservable.add(this._mouseCallback);
					this._ball.isVisible = true;
					this._webApi.serverGame.onGameStateUpdatedObservable.add((gs) => this._syncGame(gs.players), undefined, true, undefined, true);
					this._webApi.serverGame.onGameStateUpdatedObservable.add((gs) => {
						this._fields[this._playerCount - 2].isVisible = false;
						this._fields[gs.players.length - 2].isVisible = true;
					}, undefined, true, undefined, true);
					this._webApi.serverGame.unsubscribeFromRoom();
					this._webApi.serverGame.subscribeToGame();
					break;
			}
			this._mode = value;
		}
	}

	private	_scaleMeshes():	void {
		const	index:			int = this._playerCount - 2;
		const	racketScale:	Vector3 = this._racketMeshScales[index];
		this._ball.scaling = this._ballMeshScales[index];
		this._playerRackets.forEach(racket => racket.scaling = racketScale);
		this._racketPool.forEach(racket => racket.scaling = racketScale);
	}

	private static	_omitDuplicateWrapper(p1: Vector3, p2: Vector3, p3: Vector3, points: Vector3[][],
						indiceIndex: number, vertexIndex: number, mesh: AbstractMesh,
						meshIndex: number, vertices: FloatArray, indices: IndicesArray):	Vector3[][] {
		return GreasedLineTools.OmitDuplicatesPredicate(p1, p2, p3, points) || [];
	}

	private	_createField(points: Vector3[], rotate: boolean):	GreasedLineMesh {
		const	len = points.length - 1;
		const	colors:	Array<Color3> = new Array<Color3>(len);
		for (let i = 0; i < len; i += 1)
			colors[i] = this._wallColor;
		const	field:	GreasedLineMesh = CreateGreasedLine("field " + len, {
				points: points
			}, {
				useColors: true,
				colors: colors,
				useDash: true,
				width: 8,
				dashCount: 50,
				materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE,
				sizeAttenuation: true,
				colorDistributionType: GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT,
				colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_NONE
				}) as GreasedLineMesh;
		if (rotate)
			field.rotate(Axis.Z, 3 * Math.PI / 2 - Math.PI / len);
		this._glow.addIncludedOnlyMesh(field);
		this._glow.referenceMeshToUseItsOwnMaterial(field);
		field.isVisible = false;
		return field;
	}

	private	_colorizeField():	void {
		const	field:	GreasedLineMesh = this._fields[this._playerCount - 2];
		const	colors:	Array<Color3> = field.greasedLineMaterial!.colors!;
		for (let i = 0; i < colors.length; i += 1)
			colors[i] = this._wallColor;
		if (this._playerCount > 2) {
			this._colorWalls.forEach((wall, color) => {
				if (this._wallReadiness.get(wall)!)
					colors[wall] = color;
			});
		} else {
			const	iter:	MapIterator<Color3> = this._colorWalls.keys();
			const	color1:	Color3 = iter.next().value!;
			if (this._wallReadiness.get(0))
				colors[2] = color1;
			const	color2:	Color3 | undefined = iter.next().value;
			if (color2 && this._wallReadiness.get(1))
				colors[0] = color2;
		}
		field.greasedLineMaterial!.colors = colors;
	}
}
