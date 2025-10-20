// create_admin_hash.js
const bcrypt = require('bcrypt');
const saltRounds = 10;

const plainTextPassword = '12345678'; 

bcrypt.hash(plainTextPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('=== COPY HASHED PASSWORD BELOW ===');
  console.log(hash);
  console.log('==================================');
});
