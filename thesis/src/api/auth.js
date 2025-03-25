import { supabase, formActionDefault } from '@/utils/supabase'

const generateCustomID = (role) => {
  const prefix = role === 'admin' ? 'ADMIN' : 'TENANT'
  const timestamp = Date.now().toString().slice(-5) // Get last 5 digits of timestamp
  return `${prefix}-${timestamp}` // e.g., TENANT-76432
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
    const customId = generateCustomID(role, count)

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

// 🔹 Sign In Function
export const signIn = async (email, password) => {
  let action = { ...formActionDefault }

  try {
    action.formProcess = true

    // ✅ Log in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    action.formStatus = 200
    action.formSuccessMessage = 'Login successful.'
    return { ...action, user: data.user }
  } catch (error) {
    action.formStatus = 400
    action.formErrorMessage = error.message || 'Login failed.'
    return { ...action }
  } finally {
    action.formProcess = false
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
