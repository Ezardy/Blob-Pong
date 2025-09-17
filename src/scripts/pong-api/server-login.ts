import { request } from "undici";
import { config } from "dotenv";

config();

interface LoginInfo
{
	email:		string;
	password:	string;
}

interface SignUpInfo extends LoginInfo
{
	username:	string;
}

type SignUpResponse =
{
	user:
	{
		id:			string;
		username:	string;
		email:		string;
		nonce:		string;
	}
}

type LoginResponse =
{
	message:	string;
	user:
	{
		id:			string;
		username:	string;
		email:		string;
	}
}

export async function loginAsync(data: LoginInfo) : Promise<LoginResponse | undefined>
{
	const response = await request(
		process.env.SERVER_API_LOGIN ?? "http://localhost:4000/api/users/login",
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(data) 
		}
	);

	if (response.statusCode === 200)
	{
		const json : any = await response.body.json();
		return json.user as LoginResponse;
	}

	return undefined;
}

export async function registerAsync(data: SignUpInfo) : Promise<SignUpResponse | undefined>
{
	const response = await request(
		process.env.SERVER_API_SIGN_UP ?? "http://localhost:4000/api/users/register",
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(data) 
		}
	)

	if (response.statusCode === 200)
	{
		const json : any = await response.body.json();
		return {
			user: {
				id: json.id,
				email: json.email,
				username: json.username,
				nonce: json.emailVerified.nonce
			}
		};
	}

	return undefined;
}

export async function logoutAsync() : Promise<void>
{
	const response = await request(
		process.env.SERVER_API_LOG_OUT ?? "http://localhost:4000/api/users/logout")

	if (response.statusCode === 200)
	{
		console.log("Logout successful");
	}
}