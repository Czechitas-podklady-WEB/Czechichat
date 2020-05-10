const express = require('express')

const app = express()
const port = parseInt(process.env.PORT || '', 10) || 8080

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Czechichat app listening at port: ${port}`))
