import { describe, it, expect } from 'vitest';
import { parseSubtitles, parseTime } from './index';

describe('parseTime', () => {
  it('should parse valid time format with milliseconds', () => {
    expect(parseTime('00:01:30,500')).toBe(90.5);
    expect(parseTime('01:23:45,123')).toBe(5025.123);
    expect(parseTime('12:34:56,789')).toBe(45296.789);
  });

  it('should parse valid time format without milliseconds', () => {
    expect(parseTime('00:01:30')).toBe(90);
    expect(parseTime('01:23:45')).toBe(5025);
    expect(parseTime('12:34:56')).toBe(45296);
  });

  it('should parse time with dot separator', () => {
    expect(parseTime('00:01:30.500')).toBe(90.5);
    expect(parseTime('01:23:45.123')).toBe(5025.123);
  });

  it('should parse zero time', () => {
    expect(parseTime('00:00:00,000')).toBe(0);
    expect(parseTime('00:00:00')).toBe(0);
  });

  it('should parse edge case times', () => {
    expect(parseTime('23:59:59,999')).toBe(86399.999);
    expect(parseTime('00:59:59,999')).toBe(3599.999);
    expect(parseTime('00:00:59,999')).toBe(59.999);
  });

  it('should throw error for invalid format - wrong number of parts', () => {
    expect(() => parseTime('01:30')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:30',
    );
    expect(() => parseTime('01:30:45:123')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:30:45:123',
    );
    expect(() => parseTime('')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: ',
    );
  });

  it('should throw error for invalid format - non-numeric values', () => {
    expect(() => parseTime('aa:bb:cc,ddd')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: aa:bb:cc,ddd',
    );
    expect(() => parseTime('01:bb:30,500')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:bb:30,500',
    );
    expect(() => parseTime('01:30:cc,500')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:30:cc,500',
    );
    expect(() => parseTime('01:30:45,abc')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:30:45,abc',
    );
  });

  it('should throw error for invalid range - negative values', () => {
    expect(() => parseTime('-01:30:45,500')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: -01:30:45,500',
    );
    expect(() => parseTime('01:-30:45,500')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:-30:45,500',
    );
    expect(() => parseTime('01:30:-45,500')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:30:-45,500',
    );
    expect(() => parseTime('01:30:45,-500')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:30:45,-500',
    );
  });

  it('should throw error for invalid range - out of bounds', () => {
    expect(() => parseTime('01:60:45,500')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:60:45,500',
    );
    expect(() => parseTime('01:30:60,500')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:30:60,500',
    );
    expect(() => parseTime('01:30:45,1000')).toThrow(
      'time must be in the format HH:MM:SS,SSS, found: 01:30:45,1000',
    );
  });
});

describe('parseSubtitles', () => {
  it('should parse a single subtitle correctly', () => {
    const srt = '1\n00:00:01,000 --> 00:00:02,000\nTest subtitle';
    const subtitles = parseSubtitles(srt);

    expect(Array.isArray(subtitles)).toBe(true);
    expect(subtitles).toHaveLength(1);
    expect(subtitles[0]).toEqual({
      index: 1,
      start: 1,
      end: 2,
      text: 'Test subtitle',
    });
  });

  it('should parse multiple subtitles correctly', () => {
    const srt = `1
00:00:01,000 --> 00:00:02,000
First subtitle

2
00:00:03,500 --> 00:00:05,200
Second subtitle

3
00:00:06,000 --> 00:00:08,000
Third subtitle`;

    const subtitles = parseSubtitles(srt);

    expect(subtitles).toHaveLength(3);
    expect(subtitles[0]).toEqual({
      index: 1,
      start: 1,
      end: 2,
      text: 'First subtitle',
    });
    expect(subtitles[1]).toEqual({
      index: 2,
      start: 3.5,
      end: 5.2,
      text: 'Second subtitle',
    });
    expect(subtitles[2]).toEqual({
      index: 3,
      start: 6,
      end: 8,
      text: 'Third subtitle',
    });
  });

  it('should parse multiline subtitle text correctly', () => {
    const srt = `1
00:00:01,000 --> 00:00:02,000
First line
Second line
Third line

2
00:00:03,000 --> 00:00:04,000
Another subtitle`;

    const subtitles = parseSubtitles(srt);

    expect(subtitles).toHaveLength(2);
    expect(subtitles[0].text).toBe('First line\nSecond line\nThird line');
    expect(subtitles[1].text).toBe('Another subtitle');
  });

  it('should handle empty input', () => {
    const subtitles = parseSubtitles('');
    expect(subtitles).toHaveLength(0);
  });

  it('should handle whitespace and empty lines', () => {
    const srt = `

1
00:00:01,000 --> 00:00:02,000
Test subtitle


2
00:00:03,000 --> 00:00:04,000
Another subtitle

`;

    const subtitles = parseSubtitles(srt);

    expect(subtitles).toHaveLength(2);
    expect(subtitles[0].text).toBe('Test subtitle');
    expect(subtitles[1].text).toBe('Another subtitle');
  });

  it('should throw error for non-string input', () => {
    expect(() => parseSubtitles(null as any)).toThrow('input must be a string');
    expect(() => parseSubtitles(undefined as any)).toThrow(
      'input must be a string',
    );
    expect(() => parseSubtitles(123 as any)).toThrow('input must be a string');
    expect(() => parseSubtitles({} as any)).toThrow('input must be a string');
  });

  it('should throw error for invalid index format', () => {
    const srt = 'abc\n00:00:01,000 --> 00:00:02,000\nTest subtitle';
    expect(() => parseSubtitles(srt)).toThrow(
      'index must be an integer, found: abc',
    );
  });

  it('should throw error for wrong index sequence', () => {
    const srt = '2\n00:00:01,000 --> 00:00:02,000\nTest subtitle';
    expect(() => parseSubtitles(srt)).toThrow(
      'index must be 1 or the next index, found: 2',
    );
  });

  it('should throw error for non-sequential indices', () => {
    const srt = `1
00:00:01,000 --> 00:00:02,000
First subtitle

3
00:00:03,000 --> 00:00:04,000
Third subtitle`;

    expect(() => parseSubtitles(srt)).toThrow(
      'index must be 1 or the next index, found: 3',
    );
  });

  it('should throw error for invalid time format', () => {
    const srt = '1\n00:01:30\nTest subtitle';
    expect(() => parseSubtitles(srt)).toThrow(
      'time must be in the format HH:MM:SS,SSS --> HH:MM:SS,SSS, found: 00:01:30',
    );
  });

  it('should throw error for missing arrow in time line', () => {
    const srt = '1\n00:00:01,000 00:00:02,000\nTest subtitle';
    expect(() => parseSubtitles(srt)).toThrow(
      'time must be in the format HH:MM:SS,SSS --> HH:MM:SS,SSS, found: 00:00:01,000 00:00:02,000',
    );
  });

  it('should parse subtitles with dot separator in timestamps', () => {
    const srt = '1\n00:00:01.000 --> 00:00:02.500\nTest subtitle';
    const subtitles = parseSubtitles(srt);

    expect(subtitles).toHaveLength(1);
    expect(subtitles[0]).toEqual({
      index: 1,
      start: 1,
      end: 2.5,
      text: 'Test subtitle',
    });
  });

  it('should handle subtitles without milliseconds', () => {
    const srt = '1\n00:00:01 --> 00:00:02\nTest subtitle';
    const subtitles = parseSubtitles(srt);

    expect(subtitles).toHaveLength(1);
    expect(subtitles[0]).toEqual({
      index: 1,
      start: 1,
      end: 2,
      text: 'Test subtitle',
    });
  });

  it('should parse complex SRT with various formatting', () => {
    const srt = `1
00:00:00,500 --> 00:00:04,400
Welcome to the presentation

2
00:00:05,000 --> 00:00:08,200
This is a multiline subtitle
with multiple lines of text

3
00:01:30,750 --> 00:01:35,250
Final subtitle with timestamp`;

    const subtitles = parseSubtitles(srt);

    expect(subtitles).toHaveLength(3);
    expect(subtitles[0]).toEqual({
      index: 1,
      start: 0.5,
      end: 4.4,
      text: 'Welcome to the presentation',
    });
    expect(subtitles[1]).toEqual({
      index: 2,
      start: 5,
      end: 8.2,
      text: 'This is a multiline subtitle\nwith multiple lines of text',
    });
    expect(subtitles[2]).toEqual({
      index: 3,
      start: 90.75,
      end: 95.25,
      text: 'Final subtitle with timestamp',
    });
  });
});
