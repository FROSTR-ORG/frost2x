import { z } from 'zod'

const base_policy = z.object({
  host       : z.string(),
  domain     : z.string(),
  type       : z.string(),
  accept     : z.boolean(),
  created_at : z.number()
})

const nostr_conditions = z.object({
  kinds : z.record(z.number(), z.boolean()).optional()
})

const nostr_params = z.object({
  event : z.any().optional()
})

const nostr_policy = base_policy.extend({
  domain     : z.literal('nostr'),
  conditions : nostr_conditions.optional(),
  params     : nostr_params.optional()
})

const bitcoin_params = z.object({
  psbt : z.string().optional()
})

const bitcoin_policy = base_policy.extend({
  domain  : z.literal('bitcoin'),
  params  : bitcoin_params.optional()
})




