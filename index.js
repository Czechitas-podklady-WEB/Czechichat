const express = require('express')
var cors = require('cors')

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
	const d = new Date()
	const date = `${d.getDate()}. ${
		d.getMonth() + 1
	}. ${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`

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

app.post('/send-message', function (request, response) {
	const { name, message } = request.body

	if (typeof name === 'string' && typeof message === 'string') {
		createMessage(name || 'Anonymous', message)
		response.send({ status: 'ok', message: 'Message has been received.' })
	} else {
		response.send({ status: 'error', message: 'Name or message is missing.' })
	}
})

app.get('/list-messages', function (request, response) {
	response.send({ messages, lastUpdate: lastUpdate.getTime() })
})

app.listen(port, () =>
	console.log(`Czechichat app is listening at port: ${port}`),
)
