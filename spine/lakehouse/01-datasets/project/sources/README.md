Sun's five sources, and how each reaches the platform

  source             system             arrives               path
  CRM                PostgreSQL         nightly extract       batch
  billing            PostgreSQL         nightly extract       batch
  catalogue + EPG    vendor files       daily delivery        batch
  viewing events     boxes and the app  every play, and each  stream
                                        minute it plays
  network telemetry  12 exchanges       each minute           stream

Batch sources answer next morning, correctly. Stream sources answer in
seconds, while the match is on. On Priya's laptop all five come from
sun_gen, the seeded generator, into data/ (never committed).
