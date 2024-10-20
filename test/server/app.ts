import express from 'express'

const app = express()

app.use(express.json())

app.post('/api/ecdh/encrypt', (req, res) => {
  res.json(req.body)
})

app.post('/api/ecdh/decrypt', (req, res) => {
  res.json(req.body)
})

app.post('/api/sign/note', (req, res) => {
  res.json(req.body)
})

app.post('/api/sign/tx', (req, res) => {
  res.json(req.body)
})

app.listen(8082, () => {
  console.log('Express server running at http://127.0.0.1:8082')
})
