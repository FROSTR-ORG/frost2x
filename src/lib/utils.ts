export function parse_string (value: any) {
  return (typeof value === 'string') ? value : null
}

export function parse_json <T extends Record<string, any>> (
  json_str: string
) : T | null {
  try {
    return JSON.parse(json_str) as T
  } catch  {
    return null
  }
}
