const visitButton = document.querySelector('#visit-btn');
const message = document.querySelector('#message');

visitButton.addEventListener('click', () => {
  message.textContent = 'We’re open today until 6 pm. See you soon!';
});
