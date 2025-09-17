import { int } from "@babylonjs/core";

type RoomState = "waiting" | "ready";

type LobbyConnect =
{
	rooms: RoomInfo[];
	currentRoomId: string
}

type CreateRoom =
{
	success:	boolean;
	room:		RoomInfo;
}

type RoomPlayer =
{
	id:			string;
	username:	string;
};

type RoomInfo =
{
	id:					string;
	entryFee:			number;
	players:			Set<RoomPlayer>;
	maxPlayers:			number;
	createdAt:			Date;
	state:				RoomState;
	createdBy:			string;
	creatorUsername:	string;
	isCurrentRoom:		boolean;
	isCreator:			boolean;
}

class ServerGame
{
	private _lobbyWs?:				WebSocket;
	private _gameWs?:				WebSocket;
	private _sessionId?:			string;
	private _currentRoomId?:		string;
	private _rooms?:				RoomInfo[];

	constructor()
	{
		this.lobbyWs();
	}

	public lobbyWs()
	{
		this._lobbyWs = new WebSocket(`${process.env.SERVER_WS_URL ?? "ws://localhost:4000/ws"}/lobby?userId=${this._sessionId}`);

		this._lobbyWs.onopen = () =>
		{
			console.log("Connected to Lobby WebSocket ");
		};

		this._lobbyWs.onmessage = (event: MessageEvent) =>
		{
			try
			{
				const data: LobbyConnect = JSON.parse(event.data);
				this._currentRoomId = data.currentRoomId;
				this._rooms = data.rooms;
			}
			catch (error)
			{
				console.error('Error parsing lobby message:', error);
			}
		};

		this._lobbyWs.onclose = () =>
		{
			console.log("Disconnected Lobby WebSocket");
		};

		this._lobbyWs.onerror = (error) =>
		{
			console.log("Lobby WebSocket error: ", error);
		};
	}

	public createRoomWs(
		entryFee: int,
		maxPlayers: int,
	)
	{
		const ws = new WebSocket(`${process.env.SERVER_WS_URL ?? "ws://localhost:4000/ws"}/room/create?userId=${this._sessionId}`);

		ws.onopen = () =>
		{
			console.log("Connected to CreateRoom WebSocket");
			ws.send(JSON.stringify({ entryFee, maxPlayers }));
		}

		ws.onmessage = (event: MessageEvent) =>
		{
			const data : CreateRoom = event.data;
			this._currentRoomId = data.room.id;

			// TODO: connect to a Game WebSocket

			this.refreshRooms();
			ws.close();
		}

		ws.onclose = () =>
		{}
	}

	public leaveRoomWs()
	{
		const ws = new WebSocket(`${process.env.SERVER_WS_URL ?? "ws://localhost:4000/ws"}/room/leave?userId=${this._sessionId}`)

		ws.onopen = () =>
		{
			ws.send(JSON.stringify({ roomId: this._currentRoomId }));
			this._currentRoomId = undefined;
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.success)
			{
				this._currentRoomId = undefined;

				if (this._gameWs)
				{
					this._gameWs.close();
					this._gameWs = undefined;
				}
			}
			// this.handleLobbyMessage(data);
			ws.close();
		};

	}

	public gameWs()
	{
		this._gameWs = new WebSocket(`${process.env.SERVER_WS_URL ?? "ws://localhost:4000/ws"}/game/${this._currentRoomId}?userId=${this._sessionId}`);

		this._gameWs.onopen = () =>
		{
			console.log("Connected to Game WebSocket");
		}

		this._gameWs.onclose = () =>
		{}
	}

	public startGameWs()
	{
		const ws = new WebSocket(`${process.env.SERVER_WS_URL ?? "ws://localhost:4000/ws"}/game/${this._currentRoomId}/start?userId=${this._sessionId}`);

		ws.onopen = () =>
		{
			ws.send('START GAME');
		};

		ws.onmessage = (event) =>
		{
			const data = JSON.parse(event.data);
			if (data.success)
				console.log("Game started");
			else
				console.log("Failed to start the game");
			ws.close();
		};

		ws.onclose = () =>
		{
		}
	}

	public get getRooms() : RoomInfo[]
	{
		return this._rooms!;
	}

	public refreshRooms() : void
	{
		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs!.send("PING");
	}

	private isWebSocketOpen(ws: WebSocket | undefined): boolean
	{
		if (ws)
			return ws.readyState === WebSocket.OPEN;

		return false;
	}
}

const serverGame = new ServerGame;

export default serverGame;