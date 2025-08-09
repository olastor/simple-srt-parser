export type Subtitle = {
  /**
   * The numeric index of the subtitle (usually starting from 1).
   */
  index: number;

  /**
   * The start time of the subtitle in seconds.
   */
  start: number;

  /**
   * The end time of the subtitle in seconds.
   */
  end: number;

  /**
   * The text of the subtitle.
   */
  text: string;
};

type ParserState = 'seek-index' | 'seek-time' | 'seek-text';

export const parseTime = (time: string): number => {
  // be a bit less strict about the format here
  // and allow for small deviations like '.' instead of ','
  // or missing milliseconds
  const parts = time.replace('.', ',').split(':');

  if (parts.length !== 3) {
    throw new Error('time must be in the format HH:MM:SS,SSS, found: ' + time);
  }

  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  const secondsPart = parts[2].split(',');
  const seconds = Number.parseInt(secondsPart[0], 10);
  let milliseconds = 0;
  if (secondsPart.length > 1) {
    milliseconds = Number.parseInt(secondsPart[1], 10);
  }

  const isNotNaN = ![hours, minutes, seconds, milliseconds].some(Number.isNaN);
  const isValidRange =
    hours >= 0 &&
    minutes >= 0 &&
    seconds >= 0 &&
    milliseconds >= 0 &&
    minutes < 60 &&
    seconds < 60 &&
    milliseconds < 1000;

  if (!isNotNaN || !isValidRange) {
    throw new Error('time must be in the format HH:MM:SS,SSS, found: ' + time);
  }

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

export const parseSubtitles = (srt: string): Subtitle[] => {
  if (typeof srt !== 'string') {
    throw new Error('input must be a string');
  }
  const subtitles: Subtitle[] = [];
  const lines = srt.split('\n');

  let state: ParserState = 'seek-index';

  let currentSubtitle: Subtitle | null = null;
  for (const line of lines) {
    const isEmpty = line.trim() === '';
    if (isEmpty && state === 'seek-text') {
      currentSubtitle = null;
      state = 'seek-index';
    }
    if (isEmpty) continue;

    switch (state) {
      case 'seek-index': {
        const indexMatch = line.trim().match(/^\d+$/);
        if (!indexMatch) {
          throw new Error('index must be an integer, found: ' + line.trim());
        }
        const index = Number.parseInt(indexMatch[0], 10);
        if (
          !(
            (subtitles.length === 0 && index === 1) ||
            (subtitles.length > 0 &&
              index === subtitles[subtitles.length - 1].index + 1)
          )
        ) {
          throw new Error('index must be 1 or the next index, found: ' + index);
        }

        currentSubtitle = {
          index,
          start: 0,
          end: 0,
          text: '',
        };
        subtitles.push(currentSubtitle);
        state = 'seek-time';
        break;
      }
      case 'seek-time': {
        if (!currentSubtitle) {
          throw new Error('fatal: invalid parser state');
        }
        if (!line.includes('-->')) {
          throw new Error(
            'time must be in the format HH:MM:SS,SSS --> HH:MM:SS,SSS, found: ' +
              line.trim(),
          );
        }
        const [start, end] = line.trim().split('-->');
        currentSubtitle.start = parseTime(start);
        currentSubtitle.end = parseTime(end);
        state = 'seek-text';
        break;
      }
      case 'seek-text': {
        if (!currentSubtitle) {
          throw new Error('fatal: invalid parser state');
        }
        currentSubtitle.text +=
          (currentSubtitle.text === '' ? '' : '\n') + line.trim();
        break;
      }
    }
  }

  return subtitles;
};
