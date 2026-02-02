import { int, Observable } from "@babylonjs/core";
import { getTokenAsync } from "./server-login";

type LobbyRooms =
{
	rooms:			RoomInfo[];
	// currentRoomId:	string;
}

type StartGame =
{
	success:	boolean;
	message:	string;
}

type GameInit =
{
	type:	string;
	roomId:	string;
}

export type GameState =
{
	state:				"countdown" | "finished" | "playing";
	players:			GamePlayer[];
	ballPosition:		[number, number];
	countdownSeconds:	number | undefined;
}

export type GamePlayer =
{
	id:				string;
	username:		string;
	position:		number;
}

export type ResultPlayer =
{
	id:				string;
	score:			number;
	place:			string;
	username:		string;
	isActive:		boolean;
	playersKicked:	number;
}

type GameResult =
{
	gameResult:
	{
		players:	Array<ResultPlayer>;
		fee:	 number
		state:		'finished' | 'aborted';
	}
}

type RoomState = "waiting" | "ready";

type CreateRoom =
{
	createRoom:
	{
		roomId:		string;
		success:	boolean;
		isPrivate:	boolean;
	}
}

type JoinRoom =
{
	joinRoom:
	{
		roomId:		string;
		success:	boolean;
	}
}

type LeaveRoom = 
{
	leaveRoom:
	{
		success:	boolean;
	}
}

type RoomStateChanged =
{
	roomStateChanged:
	{
		roomId:		string;
	}
}

export type RoomPlayer =
{
	id:			string;
	isReady:	boolean;
	username:	string;
};

export interface RoomInfo
{
	id:			string;
	name:		string;
	count:		number;
	state:		RoomState;
	entryFee:	number;
	maxPlayers:	number;
}

export interface RoomDetails
{
	id:			string;
	players:	Array<RoomPlayer>;
	creator:	RoomPlayer;
	createdAt:	Date;
	maxPlayers:	number;
}

interface Filter
{
	type: "DESC" | "ASC";
	count: number | null;
}

export interface RoomFilter
{
	orderByBlob: Filter | null;
	orderByPlayers: Filter | null;
}

export class ServerGame
{
	private			_lobbyWs?:						WebSocket;
	private			_gameState?:					GameState;
	private			_accessToken?:					string;
	private			_currentRoomId?:				string;
	private			_lastCalledMethod?:				() => void;
	private			_lastCalledMethodName?:			string;
	public readonly	onRoomsUpdatedObservable:		Observable<RoomInfo[]>;
	public readonly	onRoomDetailsUpdatedObservable:	Observable<RoomDetails>;
	public readonly	onGameStateUpdatedObservable:	Observable<GameState>;
	public readonly	onGameResultObservable:			Observable<GameResult>;
	public readonly	onWebSocketOpenedObservable:	Observable<string>;

	constructor()
	{
		this.onRoomsUpdatedObservable = new Observable<RoomInfo[]>();
		this.onRoomDetailsUpdatedObservable = new Observable<RoomDetails>();
		this.onGameStateUpdatedObservable = new Observable<GameState>();
		this.onGameResultObservable = new Observable<GameResult>();
		this.onWebSocketOpenedObservable = new Observable<string>();
	}

	public open() : void {
		//this._lobbyWs = new WebSocket(`wss://${window.location.host}/ws/lobby?sId=${this._accessToken}`);
		getTokenAsync().then(token =>
		{
			this._accessToken = token;
			this._lobbyWs = new WebSocket(`${import.meta.env.VITE_SERVER_WS_URL}/lobby?accessToken=${this._accessToken}`);
	
			this._lobbyWs.onopen = () => {
				console.log("Connected to Lobby WebSocket ");
				this.onWebSocketOpenedObservable.notifyObservers(this._accessToken!);
	
				if (this._lastCalledMethodName)
				{
        			this._lobbyWs?.send(JSON.stringify({ type: "RECONNECT" }));
				}

				console.log(this._lastCalledMethodName);
				if (this._lastCalledMethod && this._lastCalledMethodName && this._lastCalledMethodName !== "reconnect")
				{
					console.log(`send ${this._lastCalledMethodName}`);
					this._lastCalledMethod();
					this._lastCalledMethod = undefined;
					this._lastCalledMethodName = undefined;
				}
			};
	
			this._lobbyWs.onmessage = (event: MessageEvent) =>
			{
				try
				{
					// figure out what event was sent from the server
					const data: LobbyRooms | CreateRoom | JoinRoom | LeaveRoom | RoomDetails | RoomStateChanged | GameState | GameResult | any
						= JSON.parse(event.data);

					if ("rooms" in data) // LobbyRooms
					{
						this.onRoomsUpdatedObservable.notifyObservers(data.rooms);
					}
					else if ("createRoom" in data) // CreateRoom
					{
						this._currentRoomId = data.createRoom.roomId;
					}
					else if ("joinRoom" in data) // JoinRoom
					{
						this._currentRoomId = data.joinRoom.roomId;
					}
					else if ("leaveRoom" in data)
					{
						this._currentRoomId = undefined;
					}
					else if ("creator" in data) // RoomDetails
					{
						if (!this._currentRoomId)
							this._currentRoomId = data.id;
						this.onRoomDetailsUpdatedObservable.notifyObservers(data);
					}
					else if ("roomStateChanged" in data) // RoomStateChanged
					{
						data.roomStateChanged.roomId
					}
					else if ("ballPosition" in data) // GameState
					{
						this._gameState = data;
						this.onGameStateUpdatedObservable.notifyObservers(data);
					}
					else if ("gameResult" in data) // GameResult
					{
						this.onGameResultObservable.notifyObservers(data);
					}
				}
				catch (error)
				{
					console.error('Error parsing lobby message:', error);
				}
			};
	
			this._lobbyWs.onclose = () =>
			{
				console.log("Reopen Lobby WebSocket");
				this.open();
			};
	
			this._lobbyWs.onerror = (error) => {
				console.log("Lobby WebSocket error: ", error);
			};
		})
		.catch(err =>
		{
			console.error("Error getting access token for WebSocket:", err);
		});


		window.addEventListener("message", (event: MessageEvent) =>
		{
			switch (event.data.type)
			{
				case "LOGOUT":
					this.closeWebsocket();
					break;
			}
		});
	}

	public createRoom(
		name: string,
		entryFee: int,
		maxPlayers: int,
		isPrivate: boolean = false
	) : void
	{
		this._lastCalledMethod = () => this.createRoom(name, entryFee, maxPlayers, isPrivate);
		this._lastCalledMethodName = "createRoom";
		const type = "CREATE_ROOM";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, maxPlayers, entryFee, name, isPrivate }));
	}

	public joinRoom(roomId: string) : void
	{
		this._lastCalledMethod = () => this.joinRoom(roomId);
		this._lastCalledMethodName = "joinRoom";
		const type = "JOIN_ROOM";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId }));
	}

	public leaveRoom() : void
	{
		this._lastCalledMethod = () => this.leaveRoom();
		this._lastCalledMethodName = "leaveRoom";
		const type = "LEAVE_ROOM";

		if (this.isWebSocketOpen() && this._currentRoomId)
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public markRoomPlayerReady() : void
	{
		this._lastCalledMethod = () => this.markRoomPlayerReady();
		this._lastCalledMethodName = "ready";
		const type = "READY";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public markRoomPlayerWaiting() : void
	{
		this._lastCalledMethod = () => this.markRoomPlayerWaiting();
		this._lastCalledMethodName = "waiting";
		const type = "WAITING";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public startGame() : void
	{
		this._lastCalledMethod = () => this.startGame();
		this._lastCalledMethodName = "start";
		const type = "START_GAME";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public reconnectToTopics() : void
	{
		this._lastCalledMethod = () => this.reconnectToTopics();
		this._lastCalledMethodName = "reconnect";
		const type = "RECONNECT";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type }));
	}

	public subscribeToLobby()
	{
		this._lastCalledMethod = () => this.subscribeToLobby();

		const type = "SUBSCRIBE_LOBBY";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type }));
	}
	
	public unsubscribeFromLobby()
	{
		this._lastCalledMethod = () => this.unsubscribeFromLobby();

		const type = "UNSUBSCRIBE_LOBBY";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type }));
	}

	public sendDragToServer(dragValue: number)
	{
		const type = "GAME_DATA";

		if (this.isWebSocketOpen())
			this._lobbyWs!.send(JSON.stringify({ type, dragValue: dragValue}));
	}

	public closeWebsocket()
	{
		this._lastCalledMethod = () => this.closeWebsocket();
		
		const type = "CLOSE_WS";

		if (this.isWebSocketOpen())
			this._lobbyWs!.send(JSON.stringify({ type }));
	}
	
	public filterGames(filter: RoomFilter)
	{
		this._lastCalledMethod = () => this.filterGames(filter);
		console.log(filter);
		const type = "FILTER";

		if (this.isWebSocketOpen())
			this._lobbyWs!.send(JSON.stringify({ type, filter }));
	}

	public isWebSocketOpen(): boolean
	{
		if (this._lobbyWs)
			return this._lobbyWs.readyState === WebSocket.OPEN;

		return false;
	}
}
