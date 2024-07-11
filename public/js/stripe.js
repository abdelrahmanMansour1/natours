import { showAlert } from './alert.js';

const stripe = Stripe(
  'pk_test_51PLsaGBuZyCiLqAxG6diz4wGFMB6zNwUKU42MGDIt6TlWVT3TTLfGzCSY6iS65tSIEAlCWsbplkJUoVhRtTvi2AG00fum9ygpt'
);

const bookBtn = document.getElementById('book-button');

const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session
    const session = await axios(
      `https://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    // console.log(session);
    // 2) Create checkout form + charge from credit card
    await stripe.reditectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
