import { AbstractMesh, Axis, BoundingBox, BoundingSphere, Camera, Color3, CreateGreasedLine, FloatArray, GlowLayer, GreasedLineBaseMesh, GreasedLineMesh, GreasedLineMeshMaterialType, GreasedLineRibbonMesh, GreasedLineTools, IndicesArray, InstancedMesh, int, Mesh, NodeMaterial, Nullable, PBRMaterial, Quaternion, Scene, Vector2, Vector3 } from "@babylonjs/core";
import WebApi from "./web-api";
import { getScriptByClassForObject, IScript, visibleAsColor3, visibleAsEntity, visibleAsNumber } from "babylonjs-editor-tools";
import { GamePlayer, GameState, RoomDetails } from "./web-api/server-game";

export default class Game implements IScript {
	public static readonly	NONE_MODE:	int = 0;
	public static readonly	LOBBY_MODE:	int = 1;
	public static readonly	GAME_MODE:	int = 2;

	public static readonly	MAX_PLAYERS:	int = 16;

	public	maxPlayers:	int = 2;

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
	private readonly	_colorPool:		Array<Color3> = [];
	private readonly	_wallColors:	Map<Color3, int> = new Map();
	private readonly	_playerRackets:	Map<string, InstancedMesh> = new Map();
	private readonly	_racketPool:	Array<InstancedMesh> = [];

	private	_field!:	GreasedLineBaseMesh;
	private	_ball!:		GreasedLineBaseMesh;

	private				_z:					number = 0;
	private				_y:					number = 1;
	private				_racketMeshSize:	number = 1;
	private				_ballMeshSize:		number = 1;
	private				_wallSize:			number = 1;
	private				_alpha:				number = 0;
	private				_height:			number = 0;
	private readonly	_betaSins:			Array<number> = new Array<number>(Game.MAX_PLAYERS);
	private readonly	_betaCoss:			Array<number> = new Array<number>(Game.MAX_PLAYERS);
	private readonly	_rotations:			Array<Quaternion> = new Array<Quaternion>(Game.MAX_PLAYERS);

	@visibleAsEntity("node", "racket mesh")
	private readonly	_racketMesh!:	Mesh;
	@visibleAsEntity("node", "ball mesh")
	private readonly	_ballMesh!:	Mesh;

	private	_mode:	int = 0;

	private readonly	_glow:	GlowLayer;

	public constructor(public scene: Scene) {
		this._glow = new GlowLayer("glow", scene, {blurKernelSize: 128});
		this._glow.intensity = 1.2;
	}

	public onStart(): void {
		const	bb:	BoundingBox = this._racketMesh.getBoundingInfo().boundingBox;
		const	pivot = bb.center.clone();
		pivot.y = bb.maximum.y;
		this._racketMesh.setPivotPoint(pivot);
		this._racketMeshSize = bb.extendSize.x * 2;
		this._racketMesh.isVisible = false;
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
		this._webApi.serverGame.onRoomDetailsUpdatedObservable.add((d) => this._roomDetailsCallback(d));
		this._webApi.serverGame.onGameStateUpdatedObservable.add((gs) => this._gameUpdateCallback(gs));
		const	camera:	Camera = this.scene.activeCamera!;
		this._z = camera.globalPosition.z - this._distance;
		this._y = this._z * Math.tan(camera.fov / 2) * this._padding;
	}

	private	_gameUpdateCallback(gs: GameState):	void {
		this._syncGame(gs.players);
		this._drawPlayers(gs.players);
		this._ball.position.set(gs.ballPosition[0] * this._wallSize, gs.ballPosition[1] * this._wallSize, this._z);
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
		this._drawPlayers(gamePlayers);
	}

	private	_drawPlayers(players: GamePlayer[]):	void {
		/*
		const alpha = (Math.PI * 2) / playerCount;
		const height = 0.5 / Math.tan(alpha / 2);
		const paddleWidth = 0.1;

		const beta = alpha * index;
		const gamma = beta - (Math.PI / 2);

		const distance = player.position - 0.5;
		const distance_x = distance * Math.cos(beta);
		const distance_y = distance * Math.sin(beta);
		const x_center = height * Math.cos(gamma);
		const y_center = height * Math.sin(gamma);
		const paddleX = x_center + distance_x;
		const paddleY = y_center + distance_y;
		*/
		for (const player of players) {
			const	color:	Color3 = this._playerColors.get(player.id)!;
			const	wall:	int = this._wallColors.get(color)!;
			const	racket:	InstancedMesh = this._playerRackets.get(player.id)!;
			racket.position.set(this._height * this._betaSins[wall] + (player.position - 0.5) * this._betaCoss[wall],
								this._height * (-this._betaCoss[wall]) + (player.position - 0.5) * this._betaSins[wall],
								this._z);
			racket.rotationQuaternion = this._rotations[wall];
		}
	}

	private	_syncGame(players: GamePlayer[]):	void {
		if (this._playerColors.size > players.length) {
			const	oldPlayerColors:	Map<string, Color3> = new Map();
			players.forEach(player => {
				oldPlayerColors.set(player.id, this._playerColors.get(player.id)!);
				this._playerColors.delete(player.id)
			});
			this._playerColors.forEach((color, id) => {
				this._wallColors.delete(color);
				this._playerColors.delete(id);
				const	racket:	InstancedMesh = this._playerRackets.get(id)!;
				this._playerRackets.delete(id);
				racket.isVisible = false;
				this._racketPool.push(racket);
				this._colorPool.push(color);
			});
			this._playerColors.clear();
			oldPlayerColors.forEach((color, id) => this._playerColors.set(id, color));
			this._updateFieldParams(players.length);
			this._drawField();
			this._scaleMeshes();
		}
	}

	private	_syncRoomPlayers(players: GamePlayer[]):	void {
		const	oldPlayerColor:	Map<string, Color3> = new Map();
		const	newPlayer:		GamePlayer[] = [];
		for (const p of players) {
			if (this._playerColors.has(p.id)) {
				oldPlayerColor.set(p.id, this._playerColors.get(p.id)!);
				this._playerColors.delete(p.id);
			} else
				newPlayer.push(p);
		}
		this._playerColors.forEach((v, k) =>  {
			const m:	InstancedMesh = this._playerRackets.get(k)!
			this._playerRackets.delete(k);
			this._playerColors.delete(k);
			m.isVisible = false;
			this._colorPool.push(v);
			this._racketPool.push(m);
		});
		this._playerColors.clear();
		newPlayer.forEach(player => {
			const	r:	InstancedMesh = this._racketPool.pop()!;
			const	c:	Color3 = this._colorPool.pop()!;
			r.instancedBuffers.color = c;
			r.isVisible = true;
			this._playerColors.set(player.id, c);
			this._playerRackets.set(player.id, r);
		});
		oldPlayerColor.forEach((c, id) => this._playerColors.set(id, c));
	}

	private	_drawField():	void {
		let	points:	Vector3[];
		let	colors:	Color3[];
		if (this._wallColors.size > 2) {
			points = GreasedLineTools.GetCircleLinePoints(this._y, this._wallColors.size, this._z);
			colors = Array.from(this._wallColors.keys());
		} else {
			const	x:		number = this._y * 2.2;
			const	start:	Vector3 = new Vector3(x, this._y, this._z);
			points = [
				start, new Vector3(x, -this._y, this._z), new Vector3(-x, -this._y, this._z),
				new Vector3(-x, this._y, this._z), start
			];
			const	colorIter:	MapIterator<Color3> = this._wallColors.keys();
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
					if (this._mode === 1)
						this._webApi.serverGame.usubscribeFromRoom();
					else {
						this._webApi.serverGame.unsubscribeFromGame();
						this._ball.isVisible = false;
					}
					this._glow.unReferenceMeshFromUsingItsOwnMaterial(this._field);
					this._glow.unReferenceMeshFromUsingItsOwnMaterial(this._ball);
					this._field.dispose(false, true);
					this._wallColors.clear();
					this._playerColors.forEach((color, id) => {
						const	racket:	InstancedMesh = this._playerRackets.get(id)!;
						racket.isVisible = false;
						this._racketPool.push(racket);
						this._colorPool.push(color);
					});
					this._playerColors.clear();
					this._playerRackets.clear();
					break;
				case 1:
					for (let i = 0; i < this.maxPlayers; i += 1) {
						const	color:	Color3 = Color3.Random();
						this._wallColors.set(color, i);
						this._colorPool.push(color);
					}
					this._drawField();
					this._updateFieldParams(this.maxPlayers);
					this._scaleMeshes();
					this._webApi.serverGame.subscribeToRoom();
					break;
				default:
					this._ball.isVisible = true;
					this._webApi.serverGame.unsubscribeFromGame();
					this._webApi.serverGame.subscribeToGame();
					break;
			}
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
		for (let i = 0; i < playerCount; i += 1) {
			const	beta:	number = this._alpha * i;
			this._betaSins[i] = Math.sin(beta);
			this._betaCoss[i] = Math.cos(beta);
			this._rotations[i] = Quaternion.RotationAxis(Axis.Z, -beta);
		}
	}
}
