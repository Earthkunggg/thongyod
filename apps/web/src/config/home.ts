// Order of the sections on Home (decisions #35, #54). The user can show/hide and reorder them in Settings;
// this is the default. New sections are inserted at their default position for existing users.
export type HomeSectionId = 'waiting' | 'highlights' | 'tools' | 'missions' | 'agenda' | 'pending' | 'feed' | 'discover'

export const DEFAULT_HOME_SECTIONS: HomeSectionId[] = ['waiting', 'highlights', 'tools', 'missions', 'agenda', 'pending', 'feed', 'discover']
