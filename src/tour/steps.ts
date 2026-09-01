/**
 * The guided tour script.
 *
 * Written for someone who has never heard of NEXUS and is about to judge it.
 * Every step either names a thing on screen or explains why it exists. No step
 * assumes the reader already knows what a pressure score is.
 *
 * Steps can drive the simulation through `act`, so the tour puts the console
 * into the exact state the point needs rather than hoping the clock is in the
 * right place when the reader arrives.
 */

export interface TourControls {
  seek: (minutes: number) => void
  setPlaying: (playing: boolean) => void
  setSpeed: (index: number) => void
  dispatchTop: () => void
  reset: () => void
}

export interface TourStep {
  id: string
  chapter: string
  route: string
  /** Matches a data-tour attribute. Omit for a centred chapter card. */
  target?: string
  title: string
  body: string
  points?: string[]
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right'
  padding?: number
  /** Puts the app into the state this step needs before it is shown. */
  act?: (c: TourControls) => void
}

export const CHAPTERS = [
  'THE PROBLEM',
  'THE WAR ROOM',
  'THE VISITOR',
  'THE POINT',
] as const

export const STEPS: TourStep[] = [
  /* ───────────────────────── chapter 1: the problem ──────────────────── */
  {
    id: 'welcome',
    chapter: 'THE PROBLEM',
    route: '/',
    title: 'NEXUS IN NINETY SECONDS',
    body:
      'A city hosts a mega event. A million visitors arrive inside three days. Hotels, transport and venues are each run by different people who can only see their own slice, so nobody sees the whole picture until it has already gone wrong.',
    points: [
      'This tour drives the product itself, live',
      'Arrow keys move, Escape leaves',
    ],
    act: (c) => {
      c.reset()
      c.setPlaying(false)
    },
  },
  {
    id: 'promise',
    chapter: 'THE PROBLEM',
    route: '/',
    target: 'hero-headline',
    title: 'THE ONE SENTENCE VERSION',
    body:
      'NEXUS watches every hotel, station and venue at once, works out where the crowd is about to overwhelm capacity, and says so while there is still time to act.',
    placement: 'right',
  },
  {
    id: 'scale',
    chapter: 'THE PROBLEM',
    route: '/',
    target: 'statbar',
    title: 'THE NUMBERS IN PLAY',
    body:
      'Twelve zones and roughly three hundred thousand beds, against 1.24 million expected visitors. Capacity is not the problem. Capacity being in the wrong place at the wrong time is the problem.',
    placement: 'bottom',
  },
  {
    id: 'thesis',
    chapter: 'THE PROBLEM',
    route: '/',
    target: 'manifesto',
    title: 'WHY THIS IS NOT A DASHBOARD',
    body:
      'Most tools of this kind report what already happened. That is a rear view mirror. It tells an operator their hotels filled up an hour after there was anything they could do about it.',
    placement: 'bottom',
  },
  {
    id: 'organ-pressure',
    chapter: 'THE PROBLEM',
    route: '/',
    target: 'organ-pressure',
    title: 'PART ONE: PRESSURE',
    body:
      'Every zone gets one number from 0 to 100, rebuilt every minute. Half of it is how full the zone is, a third is how fast it is filling, and the rest is what the event schedule is about to send its way.',
    points: ['70 is watch, 85 is warning, 95 is critical'],
    placement: 'top',
  },
  {
    id: 'organ-foresight',
    chapter: 'THE PROBLEM',
    route: '/',
    target: 'organ-foresight',
    title: 'PART TWO: FORESIGHT',
    body:
      'That score is projected two hours ahead, with each scheduled crowd release injected at the exact minute it happens. The answer comes back as a time, not a colour: saturation in 34 minutes.',
    placement: 'top',
  },
  {
    id: 'organ-intervention',
    chapter: 'THE PROBLEM',
    route: '/',
    target: 'organ-intervention',
    title: 'PART THREE: INTERVENTION',
    body:
      'Crossing a threshold produces a plan, not just an alarm. Which zones have room, how many people to move, and what the incentive costs per head to make them want to move.',
    placement: 'top',
  },
  {
    id: 'chain',
    chapter: 'THE PROBLEM',
    route: '/',
    target: 'chain-panel',
    title: 'IT SHOWS ITS WORKING',
    body:
      'This is the part that matters. Every alert carries the full reasoning that produced it, so the person on shift at 2am can agree with it, override it, or argue with it. A number nobody can question is a number nobody trusts.',
    placement: 'left',
  },

  /* ───────────────────────── chapter 2: the war room ──────────────────── */
  {
    id: 'wr-intro',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    title: 'NOW THE ACTUAL PRODUCT',
    body:
      'This is what the event organiser and the city operations team look at. It is deliberately dense and deliberately plain. Everything from here on is running on live simulated data, not screenshots.',
    act: (c) => {
      c.seek(305)
      c.setPlaying(false)
    },
  },
  {
    id: 'wr-clock',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-clock',
    title: 'A NIGHT ON FAST FORWARD',
    body:
      'It is 21:05 on matchday. The clock runs the evening forward so a two hour crisis fits inside a demo. You can pause it, rewind it, or speed it up.',
    placement: 'bottom',
  },
  {
    id: 'wr-scenario',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-scenario',
    title: 'THE SCENARIO',
    body:
      'Five marked beats through the night. The one that matters is the final whistle, when forty thousand people leave one stadium at the same moment. Click any marker to jump there.',
    placement: 'bottom',
  },
  {
    id: 'wr-plate',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-plate',
    title: 'THE CITY AT A GLANCE',
    body:
      'Twelve zones, not a street map. Circle size is how much capacity the zone has, the filled centre is how much is being used, and the colour is the pressure band. Lines are transport corridors, and they brighten as they load up.',
    placement: 'right',
    act: (c) => {
      c.seek(305)
      c.setPlaying(false)
    },
  },
  {
    id: 'wr-detonate',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-plate',
    title: 'THE FINAL WHISTLE',
    body:
      'Forty thousand people have just been released, and half of them are heading for one district. Watch Northgate Quarter turn. This is the moment the whole system exists for.',
    placement: 'right',
    act: (c) => {
      c.seek(331)
      c.setPlaying(false)
    },
  },
  {
    id: 'wr-queue',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-queue',
    title: 'IT SPEAKS FIRST',
    body:
      'Nobody had to go looking. Crossing the watch line put this here on its own, while the zone still has headroom left.',
    placement: 'left',
  },
  {
    id: 'wr-chain',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-alert-chain',
    title: 'READ THE REASONING',
    body:
      'Where it is now, which way it is moving, what the calendar is about to add, and the conclusion. Four lines, in order. This is the same chain the landing page promised, in the real product.',
    placement: 'left',
  },
  {
    id: 'wr-targets',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-alert-targets',
    title: 'AND IT PROPOSES A FIX',
    body:
      'Three zones that can absorb the overflow, ranked on spare room, how close they are, and how well transport reaches them. The number on the right is how many people to send to each.',
    placement: 'left',
  },
  {
    id: 'wr-dispatch',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-dispatch',
    title: 'ONE ACTION, WHOLE CITY',
    body:
      'The operator sends it. Rerouting advice and the incentive go out to every affected visitor at once. Watch what happens to the numbers after this.',
    placement: 'top',
    act: (c) => c.dispatchTop(),
  },
  {
    id: 'wr-forecast',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-forecast',
    title: 'THE TWO HOUR PROJECTION',
    body:
      'The line is where pressure is heading, the shaded band is how confident it is, and the dotted rules are the three thresholds. If the line crosses 95 within the window, the crossing point is marked with the time.',
    placement: 'top',
  },
  {
    id: 'wr-composition',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-composition',
    title: 'NOTHING IS HIDDEN',
    body:
      'The three inputs behind the score, with their weights shown. Any judge can check the arithmetic. That is a deliberate choice: a formula that can be argued with beats a black box that cannot.',
    placement: 'left',
  },
  {
    id: 'wr-table',
    chapter: 'THE WAR ROOM',
    route: '/war-room',
    target: 'wr-table',
    title: 'EVERY ZONE, RANKED',
    body:
      'The whole city sorted by pressure, worst first, with the fifteen minute change so you can see which are still climbing. Click any row to pull it into the forecast above.',
    placement: 'top',
  },

  /* ───────────────────────── chapter 3: the visitor ───────────────────── */
  {
    id: 'sg-intro',
    chapter: 'THE VISITOR',
    route: '/guide',
    title: 'THE OTHER HALF',
    body:
      'An intervention is worthless if nobody follows it. This is the same system seen by a visitor standing in the middle of the crowd, on their phone.',
  },
  {
    id: 'sg-advisory',
    chapter: 'THE VISITOR',
    route: '/guide',
    target: 'sg-phone',
    title: 'THE DISPATCH LANDED HERE',
    body:
      'That advisory at the top is the intervention sent from the War Room a moment ago. Same event, same numbers, opposite end of the system.',
    placement: 'right',
  },
  {
    id: 'sg-reason',
    chapter: 'THE VISITOR',
    route: '/guide',
    target: 'sg-pick',
    title: 'A REASON, NOT AN ORDER',
    body:
      'It never says go here. It says this district is at 27 percent, which is why the room is cheaper and the queue is shorter. Crowd control fails the moment people feel pushed, so the number that produced the advice is always attached to it.',
    placement: 'right',
  },
  {
    id: 'sg-chain',
    chapter: 'THE VISITOR',
    route: '/guide',
    target: 'sg-chain',
    title: 'FROM A NUMBER TO A SENTENCE',
    body:
      'The four steps between the engine spotting a problem and a person deciding to move. Prices here follow real demand, so a quiet district gets cheaper on its own and the nudge costs less.',
    placement: 'top',
  },

  /* ───────────────────────── chapter 4: the point ─────────────────────── */
  {
    id: 'close',
    chapter: 'THE POINT',
    route: '/',
    title: 'FROM FIREFIGHTING TO ORCHESTRATION',
    body:
      'Other systems tell you a district filled up. NEXUS tells you it is going to, names the minute, proposes who to move and where, and puts the reason in the hand of the person being moved.',
    points: [
      'One score, explainable in a sentence',
      'A two hour forecast with a time attached',
      'A ranked plan, dispatched in one action',
      'A visitor who understands why they moved',
    ],
    act: (c) => {
      c.reset()
      c.setPlaying(true)
    },
  },
]

export const TOTAL_STEPS = STEPS.length
