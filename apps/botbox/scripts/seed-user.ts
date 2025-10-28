import { hashPassword } from '../src/utils/password'

const seedUser = async () => {
  const email = 'admin@botbox.local'
  const password = 'admin123'

  const hashedPassword = await hashPassword(password)

  console.log('User seed data:')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Hashed password:', hashedPassword)
  console.log('\nRun this SQL in D1:')
  console.log(`
INSERT INTO users (email, hashed_password, created_at)
VALUES ('${email}', '${hashedPassword}', CURRENT_TIMESTAMP);
  `)
}

seedUser().catch(console.error)
