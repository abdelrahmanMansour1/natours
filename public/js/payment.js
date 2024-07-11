import { showAlert } from './alert.js';

const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session
    const session = await axios(
      `https://127.0.0.1:3000/api/v1/bookings/checkout/${tourId}`
    );
    console.log(session);
    // 2) Create checkout form + charge from credit card
    window.location.href = `${session.data.paymentURL}`;
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

const bookBtn = document.getElementById('book-button');

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourid;
    bookTour(tourId);
  });
}
