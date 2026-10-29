require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createTestUser = async () => {
  const username = 'testuser';
  const email = 'testuser@easypay.local';
  const password = 'test123456';

  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (user) {
    user.username = username;
    user.email = email;
    user.password = password;
    user.role = 'user';
    user.status = 'active';
    user.emailVerified = true;
    user.totpEnabled = false;
    user.totpSecretEncrypted = '';
    user.totpTempSecretEncrypted = '';
    await user.save();
    console.log('UPDATED_EXISTING');
  } else {
    user = new User({
      username,
      email,
      password,
      role: 'user',
      status: 'active',
      emailVerified: true,
      source: 'web'
    });
    await user.save();
    console.log('CREATED');
  }

  console.log(username);
  console.log(email);
  console.log(password);
  await mongoose.disconnect();
};

createTestUser().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
