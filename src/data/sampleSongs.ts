import type { Song } from '../types';
import { estimateScrollSpeed } from '../lib/scrollSpeed';

const DEMO_FONT_SIZE_PX = 32;
const now = () => Date.now();

const AMAZING_GRACE = `{title: Amazing Grace}
{artist: Traditional}
{key: G}
{bpm: 70}

{c: Verse 1}
[G]Amazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
[G]I once was [G7]lost, but [C]now I'm [G]found
Was [Em]blind, but [D]now I [G]see

{c: Verse 2}
[G]'Twas grace that [G7]taught my [C]heart to [G]fear
And [G]grace my [Em]fears re[D]lieved
[G]How precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved

{c: Verse 3}
[G]Through many [G7]dangers, [C]toils and [G]snares
I [G]have al[Em]ready [D]come
[G]'Tis grace hath [G7]brought me [C]safe thus [G]far
And [Em]grace will [D]lead me [G]home

{c: Verse 4}
[G]When we've been [G7]there ten [C]thousand [G]years
Bright [G]shining [Em]as the [D]sun
[G]We've no less [G7]days to [C]sing God's [G]praise
Than [Em]when we [D]first be[G]gun`;

const SWING_LOW = `{title: Swing Low, Sweet Chariot}
{artist: Traditional Spiritual}
{key: G}
{bpm: 68}

{c: Chorus}
[G]Swing low, sweet [C]chari[G]ot
Comin' for to [D]carry me [G]home
[G]Swing low, sweet [C]chari[G]ot
Comin' for to [D]carry me [G]home

{c: Verse 1}
I [G]looked over Jordan, and [C]what did I [G]see
Comin' for to carry me [D]home
A [G]band of angels [C]comin' after [G]me
Comin' for to carry me [D]home

{c: Chorus}
[G]Swing low, sweet [C]chari[G]ot
Comin' for to [D]carry me [G]home
[G]Swing low, sweet [C]chari[G]ot
Comin' for to [D]carry me [G]home

{c: Verse 2}
If [G]you get there be[C]fore I [G]do
Comin' for to carry me [D]home
Tell [G]all my friends I'm [C]comin' too
Comin' for to carry me [D]home`;

const WHEN_THE_SAINTS = `{title: When the Saints Go Marching In}
{artist: Traditional}
{key: G}
{bpm: 104}

{c: Verse 1}
[G]Oh, when the [C]saints [G]go marching [D]in
Oh, [G]when the [C]saints go [D]marching [G]in
Oh [G7]Lord, I [C]want to be in that [G]number
When the [D]saints go [G]marching [D]in

{c: Verse 2}
[G]Oh, when the [C]sun [G]refuse to [D]shine
Oh, [G]when the [C]sun refuse to [D]shine
Oh [G7]Lord, I [C]want to be in that [G]number
When the [D]sun re[G]fuse to [D]shine

{c: Verse 3}
[G]Oh, when the [C]trumpet [G]sounds the [D]call
Oh, [G]when the [C]trumpet sounds the [D]call
Oh [G7]Lord, I [C]want to be in that [G]number
When the [D]trumpet [G]sounds the [D]call`;

/** Public-domain demo charts so a fresh install isn't an empty library. */
export function sampleSongs(): Song[] {
  const t = now();
  const base = { transpose: 0, createdAt: t, updatedAt: t };
  return [
    {
      id: 'sample-amazing-grace',
      title: 'Amazing Grace',
      artist: 'Traditional',
      originalKey: 'G',
      bpm: 70,
      content: AMAZING_GRACE,
      tags: ['worship', 'hymn'],
      scrollSpeed: estimateScrollSpeed(70, DEMO_FONT_SIZE_PX),
      ...base,
    },
    {
      id: 'sample-swing-low',
      title: 'Swing Low, Sweet Chariot',
      artist: 'Traditional Spiritual',
      originalKey: 'G',
      bpm: 68,
      content: SWING_LOW,
      tags: ['worship', 'spiritual'],
      scrollSpeed: estimateScrollSpeed(68, DEMO_FONT_SIZE_PX),
      ...base,
    },
    {
      id: 'sample-when-the-saints',
      title: 'When the Saints Go Marching In',
      artist: 'Traditional',
      originalKey: 'G',
      bpm: 104,
      content: WHEN_THE_SAINTS,
      tags: ['gospel', 'up-tempo'],
      scrollSpeed: estimateScrollSpeed(104, DEMO_FONT_SIZE_PX),
      ...base,
    },
  ];
}
