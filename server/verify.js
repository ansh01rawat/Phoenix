export async function verifyInteraction(source) {
  const selectors = new Map([
    ['#visit-button', { addEventListener: (_event, handler) => { buttonHandler = handler; } }],
    ['#message', { textContent: '' }],
  ]);
  let buttonHandler;
  try {
    new Function('document', source)({ querySelector: (selector) => selectors.get(selector) || null });
    if (typeof buttonHandler !== 'function') return false;
    buttonHandler();
    return selectors.get('#message').textContent === 'We’re open today until 6 pm. See you soon!';
  } catch {
    return false;
  }
}
