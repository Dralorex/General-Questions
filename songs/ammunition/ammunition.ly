\version "2.24.0"

\header {
  title = "Ammunition"
  subtitle = "for voice and piano"
  composer = ""
  poet = ""
  tagline = ##f
}

global = {
  \key a \minor
  \time 4/4
  \tempo "Slowly, aching" 4 = 70
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% CHORD NAMES
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

chordNames = \chordmode {
  % Intro (4 bars)
  a1:m | f1:maj7 | c1 | g1 |
  % Verse pattern (4 bars) — verses 1 & 2 use this section
  a1:m | f1:maj7 | c1 | g1 |
  % Pre-Chorus (4 bars)
  d1:m | e1:7 | a1:m | a1:m |
  % Chorus (8 bars)
  f1 | c1 | g1 | a1:m |
  f1 | c1 | g1 | a1:m |
  % Bridge (4 bars)
  d1:m | a1:m | f1:maj7 | e1:7 |
  % Final Chorus (8 bars)
  f1 | c1 | g1 | a1:m |
  f1 | c1 | g1 | a1:m |
  % Outro (4 bars + final Am add2)
  a1:m | f1:maj7 | c1 | g1 |
  a1:m
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% PIANO — RIGHT HAND
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

pianoRH = {
  \global
  \clef treble

  % INTRO — sparse, one note per beat, descending shape
  \mark \markup { \bold "Intro" }
  a'4\p e' c' a |
  e' c' a f |
  g e' c' e' |
  d' b g b |

  % VERSE — broken chord eighths (root-3-5-3-oct-5-3-5)
  \mark \markup { \bold "Verse" }
  a8 c' e' c' a' e' c' e' |
  f8 a c' a f' c' a c' |
  c'8 e' g' e' c'' g' e' g' |
  g8 b d' b g' d' b d' |

  % PRE-CHORUS — sustained block chords
  \mark \markup { \bold "Pre-Chorus" }
  <d' f' a'>1\mf |
  <e' gis' b' d''>1 |
  <a c' e'>1 |
  <a c' e'>1 |

  % CHORUS — rolled full voicings
  \mark \markup { \bold "Chorus" }
  <f a c' f'>1\arpeggio |
  <c' e' g' c''>1\arpeggio |
  <g b d' g'>1\arpeggio |
  <a c' e' a'>1\arpeggio |
  <f a c' f'>1\arpeggio |
  <c' e' g' c''>1\arpeggio |
  <g b d' g'>1\arpeggio |
  <a c' e' a'>1\arpeggio |

  % BRIDGE — bare, sustained voicings
  \mark \markup { \bold "Bridge" }
  <d' f' a'>1\p |
  <a c' e'>1 |
  <f a c' e'>1 |
  <e' gis' b' d''>1\fermata |

  % FINAL CHORUS — forte, full voice
  \mark \markup { \bold "Final Chorus" }
  <f a c' f'>1\f\arpeggio |
  <c' e' g' c''>1\arpeggio |
  <g b d' g'>1\arpeggio |
  <a c' e' a'>1\arpeggio |
  <f a c' f'>1\arpeggio |
  <c' e' g' c''>1\arpeggio |
  <g b d' g'>1\arpeggio |
  <a c' e' a'>1\arpeggio |

  % OUTRO — return to intro sparseness
  \mark \markup { \bold "Outro" }
  a'4\ppp e' c' a |
  e' c' a f |
  g e' c' e' |
  d' b g b |
  <a b c' e'>1\fermata
  \bar "|."
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% PIANO — LEFT HAND
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

pianoLH = {
  \global
  \clef bass

  % INTRO — whole-note bass
  a,1\p | f,1 | c1 | g,1 |

  % VERSE — root beat 1, fifth beat 3
  a,2 e | f,2 c | c2 g | g,2 d |

  % PRE-CHORUS — octave bass
  <d, d>1\mf | <e, e>1 | <a,, a,>1 | <a,, a,>1 |

  % CHORUS — octave bass on beats 1 and 3
  <f, f>2 <f, f> |
  <c, c>2 <c, c> |
  <g, g>2 <g, g> |
  <a,, a,>2 <a,, a,> |
  <f, f>2 <f, f> |
  <c, c>2 <c, c> |
  <g, g>2 <g, g> |
  <a,, a,>2 <a,, a,> |

  % BRIDGE — bare whole notes
  d,1\p | a,,1 | f,1 | e,1\fermata |

  % FINAL CHORUS — driving quarter-note octaves
  <f, f>4\f <f, f> <f, f> <f, f> |
  <c, c>4 <c, c> <c, c> <c, c> |
  <g, g>4 <g, g> <g, g> <g, g> |
  <a,, a,>4 <a,, a,> <a,, a,> <a,, a,> |
  <f, f>4 <f, f> <f, f> <f, f> |
  <c, c>4 <c, c> <c, c> <c, c> |
  <g, g>4 <g, g> <g, g> <g, g> |
  <a,, a,>4 <a,, a,> <a,, a,> <a,, a,> |

  % OUTRO — return to sparse whole notes
  a,1\ppp | f,1 | c1 | g,1 |
  <a,,, a,,>1\fermata
  \bar "|."
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% SCORE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\score {
  <<
    \new ChordNames \chordNames
    \new PianoStaff \with { instrumentName = "Piano" } <<
      \new Staff = "up"   { \pianoRH }
      \new Staff = "down" { \pianoLH }
    >>
  >>
  \layout {
    \context {
      \Score
      \override RehearsalMark.self-alignment-X = #LEFT
      \override RehearsalMark.padding = #2
    }
  }
  \midi {
    \tempo 4 = 70
  }
}

\paper {
  #(set-paper-size "letter")
  top-margin = 15\mm
  bottom-margin = 15\mm
  left-margin = 18\mm
  right-margin = 18\mm
}
