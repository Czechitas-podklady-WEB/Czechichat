import { serve } from "https://deno.land/std@0.136.0/http/server.ts"
import { parse } from "https://deno.land/std@0.137.0/flags/mod.ts"
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts"

const { args } = Deno
const DEFAULT_PORT = 8080
const argPort = parse(args).port
const port = argPort ? Number(argPort) : DEFAULT_PORT

const LIMIT_MESSAGES_COUNT = 100

type Message = {
	name: string
	message: string
	date: string
	id: number
}
const messages: Message[] = []
let lastUpdate = new Date()
let lastMessageId = 0

const broadcastMessage = (() => {
	// @TODO: test this
	const channel = "BroadcastChannel" in globalThis
		? new BroadcastChannel("global")
		: null
	if (channel) {
		channel.onmessage = (event: MessageEvent) => {
			messages.push(event.data)
		}
	}
	return (message: Message) => {
		channel?.postMessage(message)
	}
})()

const createMessage = (name: string, text: string) => {
	const timeZone = "Europe/Prague"
	const now = new Date()
	const date = now.toLocaleDateString("cs-CZ", {
		dateStyle: "long",
		//timeStyle: "medium", // Doesn't work in deno 🤷‍♀️
		timeZone,
	})

	const time = now.toLocaleTimeString("cs-CZ", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone,
	})

	const message = {
		name,
		message: text,
		date: `${date} ${time}`,
		id: ++lastMessageId,
	}
	messages.unshift(message)

	broadcastMessage(message)

	lastUpdate = now

	if (messages.length > LIMIT_MESSAGES_COUNT) {
		messages.pop()
	}
}

createMessage("Server", "Hello, World! 🌍")
setTimeout(() => {
	createMessage("Server", "How are you?")
}, 3000)

const createJsonResponse = (
	data: Parameters<typeof JSON.stringify>[0],
	status = 200,
) =>
	new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	})

const handler = async (request: Request): Promise<Response> => {
	const url = new URL(request.url)

	// CORS
	if (request.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		})
	}

	if (url.pathname.startsWith("/api/")) {
		// List messages
		if (url.pathname === "/api/list-messages") {
			if (request.method !== "GET") {
				return createJsonResponse(
					{
						status: "error",
						message: "Only GET method is allowed.",
					},
					400,
				)
			}

			return createJsonResponse({
				messages,
				lastUpdate: lastUpdate.getTime(),
			})
		}

		// Send message
		if (url.pathname === "/api/send-message") {
			if (request.method !== "POST") {
				return createJsonResponse(
					{
						status: "error",
						message: "Only POST method is allowed.",
					},
					400,
				)
			}

			const { name, message } = await request.json()

			if (typeof name === "string" && typeof message === "string") {
				createMessage(name || "Anonymous", message)
				return createJsonResponse({
					status: "ok",
					message: "Message has been received.",
				})
			} else {
				return createJsonResponse(
					{
						status: "error",
						message: "Name or message string is missing.",
					},
					400,
				)
			}
		}

		// Not found
		return createJsonResponse({ error: "Not found" }, 404)
	}

	return staticFiles("public")({ request, respondWith: (r: Response) => r })
}

console.log(`HTTP webserver running. Access it at: http://localhost:${port}/`)
await serve(handler, { port })
