import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3033';

async function testDuplicateCookies() {
  try {
    console.log('--- 1. Login to get a valid token ---');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'testadmin@example.com',
      password: 'Admin@123',
      client_type: 'web',
    });

    // Extract the valid refresh token from the cookie
    const validCookies = loginRes.headers['set-cookie'];
    console.log('Valid Cookies:', validCookies);
    const validToken = validCookies[0].split(';')[0].split('=')[1];

    console.log('--- 2. Call refresh with DUPLICATE cookies ---');
    // We'll send the valid one and a fake/stale one
    const staleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.stale_token_dummy';

    // In Axios, we can't easily send multiple cookies with the same name in the header string
    // but the browser does: "refreshToken=val1; refreshToken=val2"
    const cookieHeader = `refreshToken=${staleToken}; refreshToken=${validToken}`;

    const refreshRes = await axios.post(
      `${BASE_URL}/api/auth/refresh`,
      {},
      {
        headers: {
          Cookie: cookieHeader,
        },
      }
    );

    console.log('Refresh Result Status:', refreshRes.status);
    console.log('Refresh Result Body:', refreshRes.data);

    if (refreshRes.status === 200 && refreshRes.data.accessToken) {
      console.log(
        'SUCCESS: Backend correctly handled duplicate cookies and returned a new access token.'
      );
    } else {
      console.log('FAILURE: Backend failed to handle duplicate cookies.');
    }
  } catch (err: any) {
    console.error('Test Failed:', err.response?.data || err.message);
  }
}

testDuplicateCookies();
