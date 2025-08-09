# simple-srt-parser

Simple SRT parser without dependencies.

```typescript
import { parseSubtitles } from 'simple-srt-parser';

const srt = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,000 --> 00:00:08,000
This is the second subtitle

`;

const subtitles = parseSubtitles(srt);
// [
//   { index: 1, start: 1, end: 4, text: "Hello world" },
//   { index: 2, start: 5, end: 8, text: "This is the second subtitle" }
// ]
```

## API

- `parseSubtitles(srt: string)` - parse srt string to subtitle array

