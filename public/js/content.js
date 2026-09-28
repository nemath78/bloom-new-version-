// ============================================================
// Bloom content data — general wellness information only.
// Nothing here diagnoses, prescribes, or replaces a clinician.
// ============================================================

const INSIGHTS = [
  {
    id: 'first-tri',
    tag: 'First trimester',
    title: 'The first twelve weeks',
    summary: 'Tiredness, nausea and big feelings are all common early on.',
    body: [
      'The first trimester runs from week 1 to the end of week 13. A lot is happening even though there is often very little to see from the outside.',
      'Fatigue is extremely common and is not a sign you are doing anything wrong. Rest when you can, and let go of the idea that you should be at full energy.',
      'Nausea affects a large share of pregnancies. Eating small amounts often, rather than three big meals, is what most people find helps the most.',
      'This is also when most people have their first appointment and dating scan. Bring a written list of questions, because it is easy to forget them in the room.'
    ]
  },
  {
    id: 'second-tri',
    tag: 'Second trimester',
    title: 'The middle stretch',
    summary: 'Often the most comfortable phase, and when movement begins.',
    body: [
      'Weeks 14 to 27 are frequently described as the easiest stretch. Nausea often settles and energy often returns, though not for everyone.',
      'Many people feel first movements somewhere between weeks 16 and 24. Early on it can feel like bubbles or flutters rather than kicks.',
      'The anatomy scan usually happens around week 20. It is a longer scan than the early ones, so allow extra time.',
      'This is a good window for gentle exercise, prenatal classes, and practical planning while energy is higher.'
    ]
  },
  {
    id: 'third-tri',
    tag: 'Third trimester',
    title: 'The final stretch',
    summary: 'Growth speeds up, sleep gets harder, and preparation begins.',
    body: [
      'From week 28 onward your baby gains weight rapidly and space gets tighter, which is why comfort becomes harder.',
      'Sleep often becomes disrupted. Side-sleeping with a pillow between the knees is what most people find helps.',
      'Appointments usually become more frequent in this trimester. This is normal and not a sign anything is wrong.',
      'Getting familiar with your provider\'s after-hours contact route now — before you need it — is genuinely worth doing.'
    ]
  },
  {
    id: 'movement',
    tag: 'Important',
    title: 'Knowing your baby\'s movement pattern',
    summary: 'Every baby has their own pattern. Changes matter.',
    body: [
      'Babies develop individual patterns of movement. What matters is not hitting a fixed number, but knowing what is usual for your baby.',
      'If movement feels reduced or different from your baby\'s normal pattern, contact your midwife or maternity unit straight away, at any hour. Do not wait until morning and do not wait for your next appointment.',
      'This is one of the few things where the guidance is genuinely urgent rather than "mention it next time". Providers would far rather check and find everything fine.',
      'Do not rely on home dopplers to reassure yourself. They can pick up sounds that seem reassuring while missing an actual problem.'
    ]
  },
  {
    id: 'nutrition',
    tag: 'Wellness',
    title: 'Eating well without overthinking it',
    summary: 'Balance and consistency matter more than perfection.',
    body: [
      'A general pattern of protein, whole grains, fruit and vegetables across the day covers most of what is needed. You do not need a perfect diet.',
      'Folate, iron, calcium and iodine are the nutrients most commonly discussed in pregnancy. Your provider can tell you what you specifically need, since this depends on your bloodwork.',
      'Hydration is frequently overlooked and affects energy, digestion and headaches.',
      'Food safety guidance varies by country. Ask your provider for the list that applies where you live rather than relying on general internet advice.'
    ]
  },
  {
    id: 'mental',
    tag: 'Wellness',
    title: 'Your mental health counts too',
    summary: 'Mood changes in pregnancy are common and treatable.',
    body: [
      'Anxiety and low mood during pregnancy are common and are not a personal failing.',
      'Sustained low mood, persistent anxiety, or feeling disconnected from the pregnancy are all worth raising with your provider. These are recognised and treatable.',
      'Small things help more than expected: daylight, gentle movement, talking to someone who listens well, and protecting sleep where possible.',
      'If you ever have thoughts of harming yourself, please contact your provider or a crisis line in your country immediately. You deserve support and it is available.'
    ]
  },
  {
    id: 'appointments',
    tag: 'Practical',
    title: 'Getting more from appointments',
    summary: 'A little preparation changes what you get out of the visit.',
    body: [
      'Write questions down as they occur to you during the week. Almost everyone forgets them once the appointment starts.',
      'It is completely reasonable to ask someone to repeat something, explain a term, or slow down. A good provider will not mind.',
      'Ask what the result of a test means specifically for you, rather than in general. Ranges and interpretation vary by individual.',
      'Ask directly: what would you want me to call you about, and on which number, outside working hours? Knowing this in advance removes hesitation later.'
    ]
  }
];

// Month-by-month general nutrition focus and common supplement topics.
// Deliberately framed as "discuss with your provider" — this app never
// tells anyone what to take.
const MONTHLY_GUIDE = {
  1: {
    diet: [
      'Folate-rich foods: leafy greens, lentils, beans, fortified cereals',
      'Small, frequent meals if nausea has started',
      'Steady fluid intake across the day'
    ],
    meds: 'Prenatal vitamins containing folic acid are commonly started before or at the very beginning of pregnancy. Your provider will tell you the dose that is right for you.',
    note: 'If you take any regular medication, ask your provider about it as early as possible rather than stopping anything on your own.'
  },
  2: {
    diet: [
      'Plain, dry foods early in the day can help with nausea',
      'Protein at each meal helps steady energy',
      'Ginger or peppermint tea if tolerated'
    ],
    meds: 'Continue whatever prenatal supplement your provider has advised. If nausea is making it hard to keep tablets down, tell them — there are usually alternatives.',
    note: 'Severe vomiting or inability to keep fluids down is not something to push through. Contact your provider.'
  },
  3: {
    diet: [
      'Iron-containing foods: red meat, lentils, tofu, spinach',
      'Vitamin C alongside iron helps absorption',
      'Fibre and fluids as digestion slows'
    ],
    meds: 'Iron may be discussed around now depending on your bloodwork. This is individual — only your provider can say whether you need it.',
    note: 'Constipation is very common. Ask your provider before using any over-the-counter remedy.'
  },
  4: {
    diet: [
      'Calcium sources: dairy, fortified plant milks, sesame, almonds',
      'Regular balanced meals as appetite often returns',
      'Omega-3 sources such as low-mercury fish, walnuts, flaxseed'
    ],
    meds: 'Some providers discuss vitamin D around this stage. Requirements vary a lot by location and skin tone.',
    note: 'Fish guidance differs by country. Ask for the list that applies where you live.'
  },
  5: {
    diet: [
      'Steady protein to support rapid growth',
      'Complex carbohydrates for sustained energy',
      'Continued iron and calcium focus'
    ],
    meds: 'Keep a written list of everything you take, including supplements, and bring it to appointments.',
    note: 'Heartburn often begins around here. Smaller meals and staying upright after eating help; ask before using antacids.'
  },
  6: {
    diet: [
      'Hydration becomes more noticeable as blood volume increases',
      'Magnesium-containing foods: nuts, seeds, whole grains',
      'Regular meals to avoid energy dips'
    ],
    meds: 'Glucose screening is commonly done around weeks 24 to 28. Your provider will explain any dietary changes if results warrant it.',
    note: 'Leg cramps are common. Mention them — there are simple things that often help.'
  },
  7: {
    diet: [
      'Smaller, more frequent meals as stomach space reduces',
      'Continued iron focus as needs peak',
      'Fibre and fluids for digestive comfort'
    ],
    meds: 'Continue prenatal supplements as advised. Do not add new supplements without checking first.',
    note: 'Swelling in feet and ankles is common, but sudden swelling in the face or hands needs same-day contact with your provider.'
  },
  8: {
    diet: [
      'Nutrient-dense foods in smaller portions',
      'Calcium and vitamin D as bone development peaks',
      'Easy-to-digest options if heartburn is significant'
    ],
    meds: 'Discuss your birth plan and any pain relief preferences now, while there is time to ask questions.',
    note: 'Ask your provider what symptoms they want to hear about immediately at this stage, and write the answer down.'
  },
  9: {
    diet: [
      'Regular light meals — energy matters now',
      'Good hydration',
      'Iron-rich foods continue to be relevant'
    ],
    meds: 'Confirm which medications are safe to have at home for common issues, and which to avoid.',
    note: 'Make sure you know your maternity unit\'s direct number and route in, day and night.'
  }
};

// Symptom check. Red-flag items route straight to "contact your provider"
// rather than offering self-care suggestions.
const SYMPTOM_QUESTIONS = [
  {
    id: 'bleeding',
    q: 'Any vaginal bleeding?',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Light spotting', value: 'spotting', urgent: true },
      { label: 'Heavier bleeding', value: 'heavy', urgent: true }
    ]
  },
  {
    id: 'movement',
    q: 'If you are past 24 weeks — how does baby\'s movement feel?',
    options: [
      { label: 'Normal for my baby', value: 'normal' },
      { label: 'Reduced or different', value: 'reduced', urgent: true },
      { label: 'Not applicable yet', value: 'na' }
    ]
  },
  {
    id: 'headache',
    q: 'Any headaches, vision changes, or upper tummy pain?',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Mild occasional headache', value: 'mild' },
      { label: 'Severe headache, blurred vision, or pain under ribs', value: 'severe', urgent: true }
    ]
  },
  {
    id: 'nausea',
    q: 'How is nausea or vomiting?',
    options: [
      { label: 'None or mild', value: 'mild' },
      { label: 'Frequent but keeping fluids down', value: 'moderate' },
      { label: 'Cannot keep fluids down', value: 'severe', urgent: true }
    ]
  },
  {
    id: 'swelling',
    q: 'Any swelling?',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Mild in feet or ankles', value: 'mild' },
      { label: 'Sudden, in face or hands', value: 'sudden', urgent: true }
    ]
  },
  {
    id: 'energy',
    q: 'How are your energy levels?',
    options: [
      { label: 'Generally fine', value: 'fine' },
      { label: 'Often tired', value: 'tired' },
      { label: 'Exhausted most days', value: 'exhausted' }
    ]
  },
  {
    id: 'sleep',
    q: 'How are you sleeping?',
    options: [
      { label: 'Well enough', value: 'fine' },
      { label: 'Broken sleep', value: 'broken' },
      { label: 'Barely sleeping', value: 'poor' }
    ]
  },
  {
    id: 'mood',
    q: 'How has your mood been this week?',
    options: [
      { label: 'Generally okay', value: 'ok' },
      { label: 'Up and down', value: 'mixed' },
      { label: 'Persistently low or anxious', value: 'low', urgent: 'soft' }
    ]
  }
];

// Comfort guidance for non-urgent answers only.
const SYMPTOM_GUIDANCE = {
  nausea_moderate: {
    title: 'Nausea',
    tips: [
      'Small amounts of food often, rather than large meals',
      'Plain, dry foods before getting out of bed',
      'Cold foods sometimes smell less strongly than hot ones',
      'Sip fluids steadily rather than in large amounts'
    ]
  },
  swelling_mild: {
    title: 'Mild swelling',
    tips: [
      'Elevate feet when sitting where you can',
      'Move regularly rather than standing still for long periods',
      'Comfortable, non-restrictive footwear',
      'Keep fluids up — it helps rather than worsens it'
    ]
  },
  energy_tired: {
    title: 'Low energy',
    tips: [
      'Short rests are more effective than pushing through',
      'Daylight early in the day helps regulate sleep',
      'Balanced meals rather than sugar for quick lifts',
      'Mention persistent exhaustion at your next appointment — it can have a treatable cause'
    ]
  },
  energy_exhausted: {
    title: 'Exhaustion',
    tips: [
      'Please mention this at your next appointment — persistent exhaustion can have causes worth checking',
      'Prioritise rest over non-essential tasks where possible',
      'Ask for help with practical things; this is not weakness',
      'Balanced meals at regular intervals'
    ]
  },
  sleep_broken: {
    title: 'Broken sleep',
    tips: [
      'Side-sleeping with a pillow between the knees',
      'A pillow supporting the bump can reduce strain',
      'Dim light and no screens in the wind-down hour',
      'Avoid large drinks right before bed, but stay hydrated across the day'
    ]
  },
  sleep_poor: {
    title: 'Very poor sleep',
    tips: [
      'Worth raising at your next appointment — there are often practical adjustments',
      'Keep the bed for sleep where possible',
      'Warm (not hot) shower before bed can help the body settle',
      'Short daytime rests are reasonable if nights are hard'
    ]
  },
  mood_mixed: {
    title: 'Mood ups and downs',
    tips: [
      'Fluctuating mood in pregnancy is common and not a failing',
      'Talking to someone who listens well genuinely helps',
      'Gentle movement and daylight have a measurable effect',
      'If it tips into persistent low mood, tell your provider — it is treatable'
    ]
  }
};

if (typeof module !== 'undefined') {
  module.exports = { INSIGHTS, MONTHLY_GUIDE, SYMPTOM_QUESTIONS, SYMPTOM_GUIDANCE };
}
