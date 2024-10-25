import express from 'express'

import { getEventHash } from 'nostr-tools'

import {
  combine_partial_sigs,
  decode_group_pkg,
  decode_secret_pkg,
  get_pubkey,
  get_session_ctx,
  sign_with_pkg,
  verify_final_sig,
  verify_partial_sig,
  verify_sig_pkg
} from '@cmdcode/bifrost/lib'

import { get_record } from '@cmdcode/bifrost/util'

const GROUP_STR  = 'bfgroup1q2t02kh5re6nvv42qd5rk7759l0qph2sauesj9aw25nt03cudg47sqqqqqpqqqqqqypgl25tn97mtamkyu42th05p8q2m4fx88e5gzfwtf9rg58h94pldmqztryqujwzdwslqr0taadnkqx7u4frhdzd8djqtqp54pyvuwth72nqy32fzrz34svjnlqk5hpyc5xszra3ndm2dtvpmhm0xyzh88pcyvtpqqqqqqsr7axyuw87jz9j9nyllquszs7yn3mkyr4v4fdm3x589nug2wm0q7lsyglpq6j29j2t5emynp4rc8xd9memm3stkkkq95rnzwd0jdzj3y7xqv7xnhlh03ec45me94x53wx5je8tga878g52tt88yxcspraup55zjqqqqqpsxsq26flshuphunrc36a90ac7whfu0kg64uwh7qwmul7hyqpwdtryqfprn5ankqhyuu5cv5e8lw7gnzc9qcysv6zn339wjecvsk8kttehxqe90d3w5ce9d6xgejr8nlhqtqtdsu79nn6wqc5z4u263up24qn4hucln0ht'
const SECRET_STR = 'bfshare1qqqqqqd3499z2qa0gxdq7haeeg2f4g9s54x2sgeczsvr2m6cppyz7y5w5fmzkmuwwlgsqctj9g5p7m02phragfgnns08psl282jzgs8n6rhr0ndsn6py0r9yw4r8tjx6nlp2a8t6sgk6ttfkx2ap0gzllydk744mjeh5yh'

const gpkg = decode_group_pkg(GROUP_STR)
const spkg = decode_secret_pkg(SECRET_STR)

const app = express()

app.use(express.json())

app.get('/api/status', (req, res) => {
  res.json({ status : 'ok' })
})

app.post('/api/ecdh/encrypt', (req, res) => {
  res.json(req.body)
})

app.post('/api/ecdh/decrypt', (req, res) => {
  res.json(req.body)
})

app.post('/api/sign/note', (req, res) => {
  const { method, body } = req

  console.log('body:', body)

  if (method !== 'POST' || body === undefined) {
    console.log('invalid request')
    res.status(400).json({ error: 'invalid request' })
    return
  }
  
  const { event, psig } = body

  const { group_pk, commits } = gpkg
  const msg    = getEventHash(body.event)
  console.log('msg:', msg)
  const ctx    = get_session_ctx(group_pk, commits, msg)
  console.log('ctx:', ctx)
  const commit = get_record(gpkg.commits, psig.idx)
  console.log('commit:', commit)

  if (!verify_sig_pkg(ctx, commit.share_pk, psig)) {
    console.log('invalid parital signature')
    res.status(400).json({ error: 'invalid parital signature' })
    return
  }

  const psig2  = sign_with_pkg(ctx, spkg)
  const pubkey = get_pubkey(spkg.share_sk)
  if (!verify_sig_pkg(ctx, pubkey, psig)) {
    console.log('invalid parital signature')
    res.status(400).json({ error: 'invalid parital signature' })
    return
  }

  const sig = combine_partial_sigs(ctx, [ psig, psig2 ])

  if (!verify_final_sig(ctx, msg, sig)) {
    console.log('invalid final signature' )
    res.status(400).json({ error: 'invalid final signature' })
    return
  }

  res.json({ ...event, sig })
})

app.post('/api/sign/tx', (req, res) => {
  res.json(req.body)
})

app.listen(8082, () => {
  console.log('Express server running at http://127.0.0.1:8082')
})
