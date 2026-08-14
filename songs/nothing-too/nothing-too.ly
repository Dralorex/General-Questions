\version "2.24.0"

\header {
  title = "Nothing Too"
  subtitle = "for guitar / voice (piano reduction)"
  composer = ""
  poet = ""
  tagline = ##f
}

global = {
  \key c \major
  \time 4/4
  \tempo "Slow, empty" 4 = 74
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% CHORD NAMES
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

chordNames = \chordmode {
  % Intro (4 bars)
  c1 | a1 | f1:m | d1:m |
  % Verse (8 bars)
  c1 | a1 | f1:m | d1:m |
  c1 | a1 | f1:m | d1:m |
  % Chorus (8 bars)
  a1 | e1 | c1:9 | c1 |
  a1 | e1 | c1:9 | c1 |
  % Bridge (4 bars)
  f1:m | d1:m | c1 | a1 |
  % Final Chorus (8 bars)
  a1 | e1 | c1:9 | c1 |
  a1 | e1 | c1:9 | c1 |
  % Outro (4 bars + final C)
  c1 | a1 | f1:m | d1:m |
  c1
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% PIANO — RIGHT HAND (guitar-style voicings)
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

pianoRH = {
  \global
  \clef treble

  % INTRO — sparse, hollow
  \mark \markup { \bold "Intro" }
  <c' e' g' c''>1\p |
  <a cis' e' a'>1 |
  <f aes c' f'>1 |
  <d' f' a'>1 |

  % VERSE — soft broken figures
  \mark \markup { \bold "Verse" }
  c'8 e' g' e' c'' g' e' g' |
  a8 cis' e' cis' a' e' cis' e' |
  f8 aes c' aes f' c' aes c' |
  d'8 f' a' f' d'' a' f' a' |
  c'8 e' g' e' c'' g' e' g' |
  a8 cis' e' cis' a' e' cis' e' |
  f8 aes c' aes f' c' aes c' |
  d'8 f' a' f' d'' a' f' a' |

  % CHORUS — fuller held voicings
  \mark \markup { \bold "Chorus" }
  <a cis' e' a'>1\mf |
  <e' gis' b' e''>1 |
  <c' e' g' d''>1 |
  <c' e' g' c''>1 |
  <a cis' e' a'>1 |
  <e' gis' b' e''>1 |
  <c' e' g' d''>1 |
  <c' e' g' c''>1 |

  % BRIDGE — bare
  \mark \markup { \bold "Bridge" }
  <f aes c'>1\pp |
  <d' f' a'>1 |
  <c' e' g'>1 |
  <a cis' e'>1 |

  % FINAL CHORUS
  \mark \markup { \bold "Final Chorus" }
  <a cis' e' a'>1\f |
  <e' gis' b' e''>1 |
  <c' e' g' d''>1 |
  <c' e' g' c''>1 |
  <a cis' e' a'>1 |
  <e' gis' b' e''>1 |
  <c' e' g' d''>1 |
  <c' e' g' c''>1 |

  % OUTRO
  \mark \markup { \bold "Outro" }
  <c' e' g' c''>1\p |
  <a cis' e' a'>1 |
  <f aes c' f'>1 |
  <d' f' a'>1 |
  <c' e' g' c''>1\fermata
  \bar "|."
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% PIANO — LEFT HAND
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

pianoLH = {
  \global
  \clef bass

  % INTRO
  c1\p | a,1 | f,1 | d1 |

  % VERSE — root then fifth
  c2 g | a,2 e | f,2 c | d2 a |
  c2 g | a,2 e | f,2 c | d2 a |

  % CHORUS — half-note pulse
  <a,, a,>2\mf <a,, a,> |
  <e, e>2 <e, e> |
  <c, c>2 <c, c> |
  <c, c>2 <c, c> |
  <a,, a,>2 <a,, a,> |
  <e, e>2 <e, e> |
  <c, c>2 <c, c> |
  <c, c>2 <c, c> |

  % BRIDGE
  f,1\pp | d1 | c1 | a,1 |

  % FINAL CHORUS
  <a,, a,>2\f <a,, a,> |
  <e, e>2 <e, e> |
  <c, c>2 <c, c> |
  <c, c>2 <c, c> |
  <a,, a,>2 <a,, a,> |
  <e, e>2 <e, e> |
  <c, c>2 <c, c> |
  <c, c>2 <c, c> |

  % OUTRO
  c1\p | a,1 | f,1 | d1 |
  c,1\fermata
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
    \tempo 4 = 74
  }
}

\paper {
  #(set-paper-size "letter")
  top-margin = 15\mm
  bottom-margin = 15\mm
  left-margin = 18\mm
  right-margin = 18\mm
}
