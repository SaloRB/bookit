'use server'

import { createAdminClient, createSessionClient } from '@/config/appwrite'
import { cookies } from 'next/headers'
import { ID } from 'node-appwrite'

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

export async function checkAuth() {
  const sessionCookie = cookies().get('appwrite-session')

  if (!sessionCookie) {
    return { isAuthenticated: false }
  }

  try {
    const { account } = await createSessionClient(sessionCookie.value)
    const user = await account.get()

    return {
      isAuthenticated: true,
      user: {
        id: user.$id,
        name: user.name,
        email: user.email,
      },
    }
  } catch (error) {
    return { isAuthenticated: false }
  }
}

export async function createUser(previousState, formData) {
  const name = formData.get('name')
  const email = formData.get('email')
  const password = formData.get('password')
  const confirm = formData.get('confirm-password')

  if (!name || !email || !password || !confirm) {
    return { error: 'Please fill out all fields' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  if (password !== confirm) {
    return { error: 'Passwords do not match' }
  }

  // Get account instance
  const { account } = await createAdminClient()

  try {
    // Create user
    await account.create(ID.unique(), email, password, name)

    return { success: true }
  } catch (error) {
    console.log('Registration Error:', error)
    return { error: 'Error creating user' }
  }
}
