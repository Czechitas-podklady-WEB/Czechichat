const express = require('express')
const cors = require('cors')

const app = express()
const port = parseInt(process.env.PORT || '', 10) || 8080

const LIMIT_MESSAGES_COUNT = 100

app.use(express.static('public'))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(cors())

const messages = []
let lastUpdate = 0

const createMessage = (name, message) => {
	const date = new Date().toLocaleDateString('cs-CZ', {
		dateStyle: 'long',
		timeStyle: 'medium',
		timeZone: 'Europe/Prague',
	})

	messages.unshift({
		name,
		message,
		date,
	})

	lastUpdate = new Date()

	if (messages.length > LIMIT_MESSAGES_COUNT) {
		messages.pop()
	}
}

createMessage('Server', 'Hello, World! 🌍')
setTimeout(() => {
	createMessage('Server', 'How are you?')
}, 3000)

const respondBadRequestPayload = (response, message) => {
	response.status(400).send({
		status: 'error',
		message: `${message} See https://czechichat.herokuapp.com/documentation/ for more details.`,
	})
}

app.post('/api/send-message', function (request, response) {
	const { name, message } = request.body

	if (typeof name === 'string' && typeof message === 'string') {
		createMessage(name || 'Anonymous', message)
		response.send({ status: 'ok', message: 'Message has been received.' })
	} else {
		respondBadRequestPayload(response, 'Name or message string is missing.')
	}
})

app.get('/api/send-message', function (request, response) {
	respondBadRequestPayload(response, 'Only POST method is allowed.')
})

app.get('/api/list-messages', function (request, response) {
	response.send({ messages, lastUpdate: lastUpdate.getTime() })
})

app.post('/api/list-messages', function (request, response) {
	respondBadRequestPayload(response, 'Only GET method is allowed.')
})

app.listen(port, () =>
	console.log(`Czechichat app is listening at port: ${port}`),
)
