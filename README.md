# simple-srt-parser

Simple SRT parser without dependencies.

```typescript
import { parseSubtitles } from 'simple-srt-parser';

const srt = `1
00:00:01,000 --> 00:00:04,000
Hello world`;

const subtitles = parseSubtitles(srt);
// [{ index: 1, start: 1, end: 4, text: "Hello world" }]
```

## API

- `parseSubtitles(srt: string)` - parse srt string to subtitle array

