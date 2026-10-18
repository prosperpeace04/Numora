import { auth } from './auth-client.js';

let mode = 'signup'; // 'signup' | 'signin'
let pendingEmail = ''; // held between sign-up and the OTP verify step

window.setMode = function (newMode) {
  mode = newMode;
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('tab-signin').classList.toggle('active', mode === 'signin');
  document.getElementById('signup-fields').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-submit').textContent = mode === 'signup' ? 'Create Account' : 'Sign In';
  document.getElementById('auth-error').textContent = '';
};

window.submitAuth = async function () {
  const errorEl = document.getElementById('auth-error');
  errorEl.textContent = '';

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    errorEl.textContent = 'Email and password are required.';
    return;
  }

  if (mode === 'signup') {
    const username = document.getElementById('su-username').value.trim();
    const fullname = document.getElementById('su-fullname').value.trim();
    const birthdate = document.getElementById('su-birthdate').value;

    if (!username || !birthdate) {
      errorEl.textContent = 'Username and birthdate are required.';
      return;
    }

    // Verified against Neon's documented signUp.email() pattern:
    // https://neon.com/docs/reference/javascript-sdk
    const { data, error } = await auth.signUp.email({
      email,
      password,
      name: fullname || username,
    });

    if (error) {
      errorEl.textContent = error.message || 'Sign up failed.';
      return;
    }

    // Stash so the verify step (below) can call /api/create-profile once
    // the email is confirmed.
    sessionStorage.setItem('numora_pending_profile', JSON.stringify({
      username, fullname, birthdate, email,
    }));

    pendingEmail = email;

    // Since "Verify at Sign-up" is ON with the Verification code method,
    // the user now needs to enter the OTP emailed to them.
    document.getElementById('step-auth').classList.add('hidden');
    document.getElementById('step-verify').classList.remove('hidden');
  } else {
    // Verified against Neon's documented signIn.email() pattern.
    const { data, error } = await auth.signIn.email({ email, password });

    if (error) {
      errorEl.textContent = error.message || 'Sign in failed.';
      return;
    }

    window.location.href = '/numora-dashboard.html';
  }
};

window.submitOtp = async function () {
  const errorEl = document.getElementById('otp-error');
  errorEl.textContent = '';
  const otp = document.getElementById('otp-code').value.trim();

  if (!otp) {
    errorEl.textContent = 'Enter the code sent to your email.';
    return;
  }

  // Verified against Neon's documented emailOtp.verifyEmail() pattern:
  // https://neon.com/docs/auth/guides/email-verification
  const { data, error } = await auth.emailOtp.verifyEmail({
    email: pendingEmail,
    otp,
  });

  if (error) {
    errorEl.textContent = error.message || 'Invalid code.';
    return;
  }

  // Now that the email is verified (and the user is signed in), finish the
  // sign-up by saving username/fullname/birthdate to our own users table —
  // this closes the TODO from submitAuth() above, via /api/create-profile.
  const pending = JSON.parse(sessionStorage.getItem('numora_pending_profile') || '{}');

  // Verified against Neon's documented authClient.token() pattern:
  // https://neon.com/docs/auth/guides/plugins/jwt
  const { data: tokenData } = await auth.token();

  if (tokenData?.token && pending.username) {
    try {
      const res = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenData.token}`,
        },
        body: JSON.stringify({
          username: pending.username,
          fullName: pending.fullname,
          birthdate: pending.birthdate,
        }),
      });

      if (!res.ok) {
        console.error('create-profile failed:', await res.text());
        errorEl.textContent = 'Signed in, but saving your profile details failed. You can retry from Account settings.';
        return;
      }

      sessionStorage.removeItem('numora_pending_profile');
    } catch (err) {
      console.error('create-profile request error:', err);
      errorEl.textContent = 'Signed in, but saving your profile details failed. You can retry from Account settings.';
      return;
    }
  }

  window.location.href = '/numora-dashboard.html';
};
