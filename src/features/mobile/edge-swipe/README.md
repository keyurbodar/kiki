# features/mobile/edge-swipe

Frame `xHBlBtSWBj` (mobile after swipe) and contact sheet `rCgbMrrwFe` (077 mobile edge swipe right end) record a right swipe from the left edge on a thread. Capy's bundle has no edge-swipe handler: the navigation sheet stays at `translate -100%` through the whole swipe timeline and the after-swipe frame equals the thread before the swipe. Parity is therefore "the swipe changes nothing", which `edge-swipe.test.tsx` pins: a touch drag from the left edge must not open the navigation sheet. The browser keeps its native edge gesture.
