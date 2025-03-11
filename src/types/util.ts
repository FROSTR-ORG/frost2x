export type Literal = string | number | boolean
export type Result<T> = { ok: true, value: T } | { ok: false, err: string }
