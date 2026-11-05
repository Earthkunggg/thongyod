import { appUrl } from '@/lib/share'

/** Link that opens (and joins) a room. Also inside the room QR. */
export const roomUrl = (code: string) => appUrl(`/games/rooms/${code}`)
