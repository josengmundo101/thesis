import { supabase, formActionDefault } from '@/utils/supabase'

// Function to generate the next custom ID based on the last entry
const generateCustomID = async (role) => {
  const prefix = role === 'admin' ? 'ADMIN' : 'TENANT'

  // Fetch the last custom_id from the database
  const { data, error } = await supabase
    .from('users')
    .select('custom_id')
    .like('custom_id', `${prefix}-%`)
    .order('custom_id', { ascending: false })
    .limit(1)

  if (error) throw error

  let nextNumber = 1 // Default to 1 if no previous ID exists

  if (data.length > 0) {
    const lastCustomID = data[0].custom_id
    const lastNumber = parseInt(lastCustomID.split('-')[1], 10)
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1
    }
  }

  return `${prefix}-${String(nextNumber).padStart(3, '0')}` // Ensures format like TENANT-001
}

// 🔹 Register User (Creates Admin if First User)
export const signUp = async (userData) => {
  let action = { ...formActionDefault } // Initialize form state

  try {
    action.formProcess = true

    // Check if this is the first user
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    if (countError) throw countError

    // Determine role
    const role = count === 0 ? 'admin' : 'tenant'

    // Generate Custom ID (e.g., TENANT-001)
    const customId = await generateCustomID(role)

    // ✅ Step 1: Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })
    if (authError) throw authError

    // ✅ Step 2: Insert user details into the "users" table
    const { error: insertError } = await supabase.from('users').insert([
      {
        user_id: authData.user.id, // Supabase Auth User ID
        email: userData.email,
        firstname: userData.firstname,
        lastname: userData.lastname,
        address: userData.address,
        contact_number: userData.contact_number,
        role, // Automatically assign role (admin or tenant)
        custom_id: customId,
      },
    ])
    if (insertError) throw insertError

    // ✅ Success Message
    action.formStatus = 200
    action.formSuccessMessage = `Account created successfully as ${role.toUpperCase()}!`
    return { ...action, user: authData.user } // Return user data for frontend usage
  } catch (error) {
    // ❌ Error Handling
    action.formStatus = 400
    action.formErrorMessage = error.message || 'Registration failed.'
    return { ...action }
  } finally {
    action.formProcess = false
  }
}

// 🔹 Sign In Function with Detailed Error Messages
export const signIn = async (email, password) => {
  let action = { ...formActionDefault }

  try {
    if (!email || !password) throw new Error('Email and Password are required.')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Handle Specific Auth Errors
      if (error.status === 400) {
        throw new Error('Invalid email or password. Please try again.')
      } else if (error.status === 429) {
        throw new Error('Too many login attempts. Please try again later.')
      } else {
        throw new Error('An unexpected error occurred. Please try again.')
      }
    }

    console.log('✅ Login Success:', data)
    action.formStatus = 200
    action.formSuccessMessage = `Welcome back!`
    return { ...action, user: data.user }
  } catch (error) {
    console.error('🛑 Login Failed:', error.message)
    action.formStatus = 400
    action.formErrorMessage = error.message || 'Login failed. Please try again.'
    return { ...action }
  }
}

// 🔹 Logout Function
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Logout Error:', error.message)
    return { success: false, message: error.message }
  }
}
