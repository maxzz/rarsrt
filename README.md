### About

Utility to combine .SRT subtitles with .MP4 files inside specified folders.

### Installation

```npn -g i rarsrt```

or

```yarn global add rarsrt```

or build an executable file using [pkg](https://www.npmjs.com/package/pkg)

```yarn makebin```

### Usage

```rarsrt <folder(s)>```

### [SRT file format](https://en.wikipedia.org/wiki/SubRip)
```
1
00:02:16,612 --> 00:02:19,376
Senator, we're making
our final approach into Coruscant.

2
00:02:19,482 --> 00:02:21,609
Very good, Lieutenant.

3
00:03:13,336 --> 00:03:15,167
We made it.

4
00:03:18,608 --> 00:03:20,371
I guess I was wrong.

5
00:03:20,476 --> 00:03:22,671
There was no danger at all.
```

[.SRT SubRip file format specification](http://forum.doom9.org/showthread.php?p=470941#post470941)

### [VTT file format](https://en.wikipedia.org/wiki/WebVTT) WebVTT
[WebVTT Standard on GitHub](https://github.com/w3c/webvtt)

```
WEBVTT

00:11.000 --> 00:13.000
<v Roger Bingham>We are in New York City

00:13.000 --> 00:16.000
<v Roger Bingham>We're actually at the Lucern Hotel, just down the street

00:16.000 --> 00:18.000
<v Roger Bingham>from the American Museum of Natural History

00:18.000 --> 00:20.000
<v Roger Bingham>And with me is Neil deGrasse Tyson

00:20.000 --> 00:22.000
<v Roger Bingham>Astrophysicist, Director of the Hayden Planetarium

00:22.000 --> 00:24.000
<v Roger Bingham>at the AMNH.

00:24.000 --> 00:26.000
<v Roger Bingham>Thank you for walking down here.

00:27.000 --> 00:30.000
<v Roger Bingham>And I want to do a follow-up on the last conversation we did.

00:30.000 --> 00:31.500 align:right size:50%
<v Roger Bingham>When we e-mailed—

00:30.500 --> 00:32.500 align:left size:50%
<v Neil deGrasse Tyson>Didn't we talk about enough in that conversation?

00:32.000 --> 00:35.500 align:right size:50%
<v Roger Bingham>No! No no no no; 'cos 'cos obviously 'cos

00:32.500 --> 00:33.500 align:left size:50%
<v Neil deGrasse Tyson><i>Laughs</i>

00:35.500 --> 00:38.000
<v Roger Bingham>You know I'm so excited my glasses are falling off here.
```

//G: 'srt file format wiki'
//G: 'vtt file format wiki'
