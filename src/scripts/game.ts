import { AbstractMesh, Axis, BoundingBox, BoundingSphere, Camera, Color3, CreateGreasedLine, FloatArray, GlowLayer, GreasedLineBaseMesh, GreasedLineMesh, GreasedLineMeshColorDistribution, GreasedLineMeshColorDistributionType, GreasedLineMeshMaterialType, GreasedLineTools, IndicesArray, InstancedMesh, int, Mesh, Nullable, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import WebApi from "./web-api";
import { getScriptByClassForObject, IScript, visibleAsColor3, visibleAsEntity, visibleAsNumber } from "babylonjs-editor-tools";
import { GamePlayer, GameState, RoomDetails } from "./web-api/server-game";

export default class Game implements IScript {
	public static readonly	NONE_MODE:	int = 0;
	public static readonly	LOBBY_MODE:	int = 1;
	public static readonly	GAME_MODE:	int = 2;

	public static readonly	MAX_PLAYERS:	int = 16;

	private static readonly	_colors:		Array<Color3> = [
		new Color3(230 / 255, 25 / 255, 75 / 255), new Color3(60 / 255, 180 / 255, 75 / 255), new Color3(255 / 255, 225 / 255, 25 / 255),
		new Color3(0 / 255, 130 / 255, 200 / 255), new Color3(245 / 255, 130 / 255, 48 / 255), new Color3(145 / 255, 30 / 255, 180 / 255),
		new Color3(70 / 255, 240 / 255, 240 / 255), new Color3(240 / 255, 50 / 255, 230 / 255), new Color3(210 / 255, 245 / 255, 60 / 255),
		new Color3(0 / 255, 128 / 255, 128 / 255), new Color3(220 / 255, 190 / 255, 255 / 255),
		new Color3(170 / 255, 110 / 255, 40 / 255), new Color3(255 / 255, 250 / 255, 200 / 255), new Color3(128 / 255, 0 / 255, 0 / 255),
		new Color3(170 / 255, 255 / 255, 195 / 255), new Color3(128 / 255, 128 / 255, 0 / 255), new Color3(255 / 255, 215 / 255, 180 / 255),
		new Color3(0 / 255, 0 / 255, 128 / 255), new Color3(128 / 255, 128 / 255, 128 / 255)];
	private static readonly	_rectFieldRot:	Quaternion = Quaternion.RotationAxis(Axis.Z, Math.PI);

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

	private readonly	_fields:		Array<GreasedLineMesh> = new Array<GreasedLineMesh>(Game.MAX_PLAYERS - 1);
	private readonly	_playerColors:	Map<string, Color3> = new Map<string, Color3>();
	private readonly	_colorWalls:	Map<Color3, int> = new Map<Color3, int>();
	private readonly	_wallReadiness:	Map<int, boolean> = new Map<int, boolean>();
	private readonly	_playerRackets:	Map<string, InstancedMesh> = new Map<string, InstancedMesh>();
	private readonly	_racketPool:	Array<InstancedMesh> = new Array<InstancedMesh>(Game.MAX_PLAYERS);
	private readonly	_colorPool:		Array<Color3> = new Array<Color3>(Game.MAX_PLAYERS);

	private	_ball!:		GreasedLineBaseMesh;

	private				_z:					number = 0;
	private				_y:					number = 1;
	private				_racketMeshSize:	number = 1;
	private				_ballMeshSize:		number = 1;
	private				_wallSize:			number = 1;
	private				_alpha:				number = 0;
	private				_shift:				int = 0;
	private				_height:			number = 0;
	private readonly	_betaSins:			Array<number> = new Array<number>(Game.MAX_PLAYERS);
	private readonly	_betaCoss:			Array<number> = new Array<number>(Game.MAX_PLAYERS);
	private readonly	_rotations:			Array<Quaternion> = new Array<Quaternion>(Game.MAX_PLAYERS);

	@visibleAsEntity("node", "racket mesh")
	private readonly	_racketMesh!:	Mesh;
	@visibleAsEntity("node", "ball mesh")
	private readonly	_ballMesh!:	Mesh;

	private	_mode:			int = 0;
	private	_maxPlayers:	int = 2;

	private readonly	_glow:	GlowLayer;

	public constructor(public scene: Scene) {
		// Rendering
		this._glow = new GlowLayer("glow", scene, {blurKernelSize: 128});
		this._glow.intensity = 1.2;
	}

	public onStart(): void {
		// Web
		this._webApi = getScriptByClassForObject(this.scene, WebApi)!;
		this._webApi.serverGame.onRoomDetailsUpdatedObservable.add((d) => this._roomDetailsCallback(d));
		this._webApi.serverGame.onGameStateUpdatedObservable.add((gs) => this._gameUpdateCallback(gs));
		// Rendering
		const	camera:	Camera = this.scene.activeCamera!;
		this._z = camera.globalPosition.z + this._distance;
		this._y = this._distance * Math.tan(camera.fov / 2) * (1 - this._padding);
		const	x:		number = this._y * this._rectangleRatio;
		const	start:	Vector3 = new Vector3(x, this._y, this._z);
		this._fields[0] = this._createField([
				start, new Vector3(x, -this._y, this._z), new Vector3(-x, -this._y, this._z),
				new Vector3(-x, this._y, this._z), start], false);
		for (let i = 1; i < this._fields.length; i += 1)
			this._fields[i] = this._createField(GreasedLineTools.GetCircleLinePoints(this._y, i + 2, this._z), true);
		this.scene.onBeforeRenderObservable.add(() => this._fields[this._maxPlayers - 2].greasedLineMaterial!.dashOffset += 0.001);
		const	bb:	BoundingBox = this._racketMesh.getBoundingInfo().boundingBox;
		const	pivot = bb.center.clone();
		pivot.y = bb.maximum.y;
		this._racketMesh.setPivotPoint(pivot);
		this._racketMeshSize = bb.extendSizeWorld.x * 2;
		this._racketMesh.registerInstancedBuffer("instanceColor", 3);
		this._racketMesh.instancedBuffers.instanceColor = Color3.Random();
		this._racketMesh.isVisible = false;
		for (let i = 0; i < Game.MAX_PLAYERS; i += 1) {
			const inst:	InstancedMesh = this._racketMesh.createInstance("racket " + i);
			inst.isVisible = false;
			this._racketPool[i] = inst;
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
		this._glow.addIncludedOnlyMesh(this._ball);
		this._glow.referenceMeshToUseItsOwnMaterial(this._ball);
		this._ballMesh.isVisible = false;
		this._ball.isVisible = false;
	}

	private	_gameUpdateCallback(gs: GameState):	void {
		this._syncGame(gs.players);
		this._drawPlayers(gs.players);
		const	ballPos:	Vector3 = new Vector3(gs.ballPosition[0] * this._wallSize, gs.ballPosition[1] * this._wallSize, this._z);
		if (gs.players.length == 2) {
			if (this._shift)
				ballPos.applyRotationQuaternionInPlace(Game._rectFieldRot);
		} else
			ballPos.applyRotationQuaternionInPlace(this._rotations[this._shift]);
		this._ball.position.copyFrom(ballPos);
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
		if (this._maxPlayers > 2) {
			for (const player of players) {
				const	color:	Color3 = this._playerColors.get(player.id)!;
				const	wall:	int = this._colorWalls.get(color)!;
				const	racket:	InstancedMesh = this._playerRackets.get(player.id)!;
				racket.position.set(this._height * this._betaSins[wall] + (player.position - 0.5) * this._betaCoss[wall],
									this._height * (-this._betaCoss[wall]) + (player.position - 0.5) * this._betaSins[wall],
									this._z);
				racket.rotationQuaternion = this._rotations[wall];
			}
		} else {
				const	color1:		Color3 = this._playerColors.get(players[0].id)!;
				const	wall1:		int = this._colorWalls.get(color1)!;
				const	racket1:	InstancedMesh = this._playerRackets.get(players[0].id)!;
				const	width:		number = this._y * this._rectangleRatio;
				if (players.length > 1) {
					const	color2:		Color3 = this._playerColors.get(players[1].id)!;
					const	wall2:		int = this._colorWalls.get(color2)!;
					const	racket2:	InstancedMesh = this._playerRackets.get(players[1].id)!;
					racket2.position.set(width, (players[1].position - 0.5) * this._y * 2, this._z);
					racket2.rotationQuaternion = this._rotations[wall2];
				}
				racket1.position.set(-width, (0.5 - players[0].position) * this._y * 2, this._z);
				racket1.rotationQuaternion = this._rotations[wall1];
		}
	}

	private	_syncGame(players: GamePlayer[]):	void {
		this._maxPlayers = players.length;
		if (this._playerColors.size > players.length) {
			this._fields[this._playerColors.size - 2].isVisible = false;
			this._syncRoomPlayers(players);
			this._fields[players.length - 2].isVisible = true;
			this._colorizeField();
			this._updateFieldParams(players.length);
			this._scaleMeshes();
		}
	}

	private	_syncRoomPlayers(players: GamePlayer[]):	void {
		const	playerColors:	Map<string, Color3> = new Map(this._playerColors);
		this._colorWalls.clear();
		let	j:	int;
		for (j = 0; j < players.length && players[0].id !== this._webApi.clientInfo!.id; j += 1, players.push(players.shift()!), this._colorPool.unshift(this._colorPool.pop()!));
		this._shift = j;
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
		j = players.length - j;
		for (let i = 0; i < j; i += 1)
			func(i, i, () => this._colorPool.pop());
		let	k:	int = this._maxPlayers - this._shift;
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

	public get	maxPlayers():	int {
		return this._maxPlayers;
	}

	public set	maxPlayers(value: int) {
		if (!this._mode && value > 1 && value <= Game.MAX_PLAYERS) {
			this._maxPlayers = value;
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
					this._fields[this._maxPlayers - 2].isVisible = false;
					break;
				case 1:
					for (let i = 0; i < Game.MAX_PLAYERS; i += 1)
						this._colorPool[Game.MAX_PLAYERS - i - 1] = Game._colors[i];
					this._updateFieldParams(this._maxPlayers);
					this._scaleMeshes();
					this._fields[this._maxPlayers - 2].isVisible = true;
					break;
				default:
					this._ball.isVisible = true;
					this._webApi.serverGame.unsubscribeFromRoom();
					this._webApi.serverGame.subscribeToGame();
					break;
			}
			this._mode = value;
		}
	}

	private	_scaleMeshes():	void {
		const	racketScale:	number = this._racketSize / 100 * this._wallSize / this._racketMeshSize;
		const	ballScale:		number = this._ballSize / 100 * this._wallSize / this._ballMeshSize;
		this._ballMeshSize *= ballScale;
		this._racketMeshSize *= racketScale;
		this._ball.scaling.scaleInPlace(ballScale);
		this._playerRackets.forEach(racket => racket.scaling.scaleInPlace(racketScale));
		this._racketPool.forEach(racket => racket.scaling.scaleInPlace(racketScale));
	}

	private static	_omitDuplicateWrapper(p1: Vector3, p2: Vector3, p3: Vector3, points: Vector3[][],
						indiceIndex: number, vertexIndex: number, mesh: AbstractMesh,
						meshIndex: number, vertices: FloatArray, indices: IndicesArray):	Vector3[][] {
		return GreasedLineTools.OmitDuplicatesPredicate(p1, p2, p3, points) || [];
	}

	private	_updateFieldParams(playerCount: int):	void {
		this._alpha = 2 * Math.PI / playerCount;
		this._wallSize = 2 * this._y * Math.cos(Math.PI / 2 - Math.PI / playerCount);
		this._height = this._wallSize / 2 / Math.tan(this._alpha / 2);
		if (playerCount > 2) {
			for (let i = 0; i < playerCount; i += 1) {
				const	beta:	number = this._alpha * i;
				this._betaSins[i] = Math.sin(beta);
				this._betaCoss[i] = Math.cos(beta);
				this._rotations[i] = Quaternion.RotationAxis(Axis.Z, beta);
			}
		} else {
			this._rotations[0] = Quaternion.RotationAxis(Axis.Z, -Math.PI / 2);
			this._rotations[1] = Quaternion.RotationAxis(Axis.Z, Math.PI / 2);
		}
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
		const	field:	GreasedLineMesh = this._fields[this._maxPlayers - 2];
		const	colors:	Array<Color3> = field.greasedLineMaterial!.colors!;
		for (let i = 0; i < this._maxPlayers; i += 1)
			colors[i] = this._wallColor;
		if (this._maxPlayers > 2) {
			this._colorWalls.forEach((wall, color) => {
				if (this._wallReadiness.get(wall)!)
					colors[wall] = color;
			});
		} else {
			const	iter:	MapIterator<Color3> = this._colorWalls.keys();
			const	color1:	Color3 = iter.next().value!;
			colors[2] = color1;
			const	color2:	Color3 | undefined = iter.next().value;
			if (color2)
				colors[0] = color2;
		}
		field.greasedLineMaterial!.colors = colors;
	}
}
