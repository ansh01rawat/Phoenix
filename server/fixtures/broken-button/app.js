const button = document.querySelector('#visit-btn');
const message = document.querySelector('#message');
button?.addEventListener('click', () => {
  message.textContent = 'Visit information is ready.';
});
