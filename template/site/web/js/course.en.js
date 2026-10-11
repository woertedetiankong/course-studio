// English text for course.js. Only the fields written here change in English mode; everything else
// (ids, steps, links, status) comes from course.js. Episodes are matched by id. An array replaces the
// Chinese one wholesale; to change only some fields of objects in an array, key them by index ({0: {...}}).
// Every episode added to course.js gets its English here too.
enOverlay(window.COURSE_META, {
  title: '__COURSE_TITLE_EN__',
  subtitle: '__COURSE_SUBTITLE_EN__',
  mapNote: 'Follows the original course\'s schedule. Each episode explains one core mechanism.',
  footer: 'Paper and assignment links point to the original course site. The videos, lab pages and dojos here are self-study aids; all exercises and tests are original.',
});

enOverlay(window.EPISODES, {
  ep01: {title: '__EP01_TITLE_EN__', group: 'Foundations',
    desc: 'A sentence or two on the problem this episode solves and the one intuition to take away.',
    videoTime: 'about 6 min',
    reading: {title: 'Full title of the paper or textbook chapter', time: '2 to 4 hours',
      read: ['Sections 1 and 2: read quickly', 'Section 3: read closely'],
      ask: ['A question you should be able to answer afterwards', 'Another question you should be able to answer']},
    lab: {time: 'about 1 hour', desc: 'Start with the prediction questions: pick an answer first, then run the same scenario in the simulator. Then cause failures yourself.'},
    dojoTime: '1 to 2 hours',
    dojoDesc: '__DOJO_DESC_EN__',
    assignment: {title: 'Do the real assignment', time: '5 to 15 hours',
      notes: ['Same ideas as the dojo; what changes is the interface: …']}},
  ep02: {title: 'Title of the next episode', group: 'Foundations'},
});
