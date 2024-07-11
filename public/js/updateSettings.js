/* eslint-disable */
import { showAlert } from './alert.js';

const updateSettings = async (data, type) => {
  try {
    const url = type === 'Password' ? 'updateMyPassword' : 'updateMe';
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${url}`,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type} updated successfully`);
    }
  } catch (error) {
    showAlert('error', 'Something went wrong');
    console.log(error);
  }
};

const updatedata = document.querySelector('.form-user-data');

if (updatedata) {
  updatedata.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'Data');
  });
}

const updatePassword = document.querySelector('.form-user-password');

if (updatePassword) {
  updatePassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn__save--password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'Password'
    );

    document.querySelector('.btn__save--password').textContent =
      'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
