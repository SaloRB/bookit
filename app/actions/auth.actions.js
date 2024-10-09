'use server'

import { cookies } from 'next/headers'
import { createAdminClient, createSessionClient } from '../config/appwrite'

export async function createSession(previousState, formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    return { error: 'Please fill out all fields' }
  }

  // Get account instance
  const { account } = await createAdminClient()

  try {
    // Generate session
    const session = await account.createEmailPasswordSession(email, password)

    // Create cookie
    cookies().set('appwrite-session', session.secret, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expirtes: new Date(session.expire),
      path: '/',
    })

    return { success: true }
  } catch (error) {
    console.log('Authentication Error:', error)
    return { error: 'Invalid email or password' }
  }
}

export async function deleteSession() {
  // Retrieve the session cookie
  const sessionCookie = cookies().get('appwrite-session')
  if (!sessionCookie) {
    return { error: 'No session cookie found' }
  }
  try {
    const { account } = await createSessionClient(sessionCookie.value)

    // Delete session
    await account.deleteSession('current')

    // Clear cookie
    cookies().delete('appwrite-session')

    return { success: true }
  } catch (error) {
    return { error: 'Error deleting session' }
  }
}
