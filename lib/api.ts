import { NextResponse } from 'next/server'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}
