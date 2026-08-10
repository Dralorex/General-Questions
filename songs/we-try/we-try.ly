\version "2.24.0"

\header {
  title = "We Try"
  subtitle = "for voice and piano"
  composer = ""
  poet = ""
  tagline = ##f
}

global = {
  \key g \major
  \time 4/4
  \tempo "Soft pop, building" 4 = 82
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% CHORD NAMES
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

chordNames = \chordmode {
  % Intro (4 bars)
  g1 | e1:m | c1 | d1 |
  % Verse (8 bars)
  g1 | e1:m | c1 | d1 |
  g1 | e1:m | c1 | d1 |
  % Pre-Chorus (4 bars)
  a1:m | e1:m | c1 | d1 |
  % Chorus (8 bars)
  g1 | d1 | e1:m | c1 |
  g1 | d1 | e1:m | c1 |
  % Bridge (8 bars)
  e1:m | c1 | g1 | d1 |
  e1:m | c1 | g1 | d1 |
  % Final Chorus (8 bars)
  g1 | d1 | e1:m | c1 |
  g1 | d1 | e1:m | c1 |
  % Outro (4 bars + final G add9)
  g1 | e1:m | c1 | d1 |
  g1
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% PIANO — RIGHT HAND
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

pianoRH = {
  \global
  \clef treble

  % INTRO — soft, sparse broken chords
  \mark \markup { \bold "Intro" }
  g'8\p b' d'' b' g'' d'' b' d'' |
  e'8 g' b' g' e'' b' g' b' |
  c'8 e' g' e' c'' g' e' g' |
  d'8 fis' a' fis' d'' a' fis' a' |

  % VERSE — gentle rolling eighths
  \mark \markup { \bold "Verse" }
  g'8 b' d'' b' g'' d'' b' d'' |
  e'8 g' b' g' e'' b' g' b' |
  c'8 e' g' e' c'' g' e' g' |
  d'8 fis' a' fis' d'' a' fis' a' |
  g'8 b' d'' b' g'' d'' b' d'' |
  e'8 g' b' g' e'' b' g' b' |
  c'8 e' g' e' c'' g' e' g' |
  d'8 fis' a' fis' d'' a' fis' a' |

  % PRE-CHORUS — sustained blocks, building
  \mark \markup { \bold "Pre-Chorus" }
  <a' c'' e''>1\mf |
  <e' g' b'>1 |
  <c' e' g' c''>1 |
  <d' fis' a' d''>1 |

  % CHORUS — big rolled voicings (powerful)
  \mark \markup { \bold "Chorus" }
  <g b d' g'>1\f\arpeggio |
  <d' fis' a' d''>1\arpeggio |
  <e' g' b' e''>1\arpeggio |
  <c' e' g' c''>1\arpeggio |
  <g b d' g'>1\arpeggio |
  <d' fis' a' d''>1\arpeggio |
  <e' g' b' e''>1\arpeggio |
  <c' e' g' c''>1\arpeggio |

  % BRIDGE — bare, intimate
  \mark \markup { \bold "Bridge" }
  <e' g' b'>1\p |
  <c' e' g'>1 |
  <g b d'>1 |
  <d' fis' a'>1 |
  <e' g' b'>1 |
  <c' e' g'>1 |
  <g b d' g'>1 |
  <d' fis' a' d''>1 |

  % FINAL CHORUS — peak
  \mark \markup { \bold "Final Chorus" }
  <g b d' g'>1\ff\arpeggio |
  <d' fis' a' d''>1\arpeggio |
  <e' g' b' e''>1\arpeggio |
  <c' e' g' c''>1\arpeggio |
  <g b d' g'>1\arpeggio |
  <d' fis' a' d''>1\arpeggio |
  <e' g' b' e''>1\arpeggio |
  <c' e' g' c''>1\arpeggio |

  % OUTRO — return to soft rolling feel
  \mark \markup { \bold "Outro" }
  g'8\p b' d'' b' g'' d'' b' d'' |
  e'8 g' b' g' e'' b' g' b' |
  c'8 e' g' e' c'' g' e' g' |
  d'8 fis' a' fis' d'' a' fis' a' |
  <g a b d'>1\fermata
  \bar "|."
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% PIANO — LEFT HAND
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

pianoLH = {
  \global
  \clef bass

  % INTRO — soft whole-note bass
  g,1\p | e,1 | c1 | d1 |

  % VERSE — root beat 1, fifth beat 3
  g,2 d | e,2 b, | c2 g | d2 a |
  g,2 d | e,2 b, | c2 g | d2 a |

  % PRE-CHORUS — octave bass, building
  <a,, a,>1\mf | <e,, e,>1 | <c, c>1 | <d, d>1 |

  % CHORUS — driving half-note octaves
  <g,, g,>2\f <g,, g,> |
  <d, d>2 <d, d> |
  <e,, e,>2 <e,, e,> |
  <c, c>2 <c, c> |
  <g,, g,>2 <g,, g,> |
  <d, d>2 <d, d> |
  <e,, e,>2 <e,, e,> |
  <c, c>2 <c, c> |

  % BRIDGE — bare whole notes
  e,1\p | c,1 | g,,1 | d,1 |
  e,1 | c,1 | g,,1 | d,1 |

  % FINAL CHORUS — driving quarter-note octaves
  <g,, g,>4\ff <g,, g,> <g,, g,> <g,, g,> |
  <d, d>4 <d, d> <d, d> <d, d> |
  <e,, e,>4 <e,, e,> <e,, e,> <e,, e,> |
  <c, c>4 <c, c> <c, c> <c, c> |
  <g,, g,>4 <g,, g,> <g,, g,> <g,, g,> |
  <d, d>4 <d, d> <d, d> <d, d> |
  <e,, e,>4 <e,, e,> <e,, e,> <e,, e,> |
  <c, c>4 <c, c> <c, c> <c, c> |

  % OUTRO — soft whole notes again
  g,1\p | e,1 | c1 | d1 |
  <g,,, g,,>1\fermata
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
    \tempo 4 = 82
  }
}

\paper {
  #(set-paper-size "letter")
  top-margin = 15\mm
  bottom-margin = 15\mm
  left-margin = 18\mm
  right-margin = 18\mm
}
