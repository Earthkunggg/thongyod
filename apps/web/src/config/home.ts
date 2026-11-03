// Order of the cards on Home (below the week strip). Decision #35:
// later the user can show/hide and reorder these in Settings; this is the default.
export type HomeSectionId = 'waiting' | 'agenda' | 'pending' | 'pet' | 'feed'

export const DEFAULT_HOME_SECTIONS: HomeSectionId[] = ['waiting', 'agenda', 'pending', 'pet', 'feed']
