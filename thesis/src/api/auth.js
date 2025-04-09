import { supabase, formActionDefault } from '@/utils/supabase'
import router from '@/router'
import { toast } from 'vue3-toastify'

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
  let action = { ...formActionDefault }

  try {
    action.formProcess = true

    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    if (countError) throw countError

    console.log('✅ User Count:', count)

    const role = count === 0 ? 'admin' : 'tenant'
    const status = role === 'tenant' ? 'pending' : null
    const customId = await generateCustomID(role)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })
    if (authError) throw authError

    const { error: insertError } = await supabase.from('users').insert([
      {
        user_id: authData.user.id,
        email: userData.email,
        firstname: userData.firstname,
        lastname: userData.lastname,
        address: userData.address,
        contact_number: userData.contact_number,
        role,
        custom_id: customId,
        ...(status && { status }),
      },
    ])
    if (insertError) throw insertError

    await supabase.auth.signOut()
    localStorage.removeItem('user_role') // Clear role to prevent conflicts

    action.formStatus = 200
    action.formSuccessMessage =
      role === 'tenant'
        ? 'Account created successfully! Please wait for admin approval before signing in.'
        : 'Admin account created successfully!'
    return { ...action, user: authData.user, role }
  } catch (error) {
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
      if (error.status === 400) {
        throw new Error('Invalid email or password. Please try again.')
      } else if (error.status === 429) {
        throw new Error('Too many login attempts. Please try again later.')
      } else {
        throw new Error('An unexpected error occurred. Please try again.')
      }
    }

    const user = data.user

    const { data: profile, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('user_id', user.id)
      .single()

    if (userError) throw userError

    console.log('✅ Fetched Profile:', profile) // Add this log

    const role = profile.role
    const status = profile.status

    if (status !== 'approved') {
      await supabase.auth.signOut()
      toast.warning('Your account is not approved yet. Please wait for admin confirmation.')
      action.formStatus = 403
      action.formErrorMessage =
        'Your account is not approved yet. Please wait for admin confirmation.'
      router.push('/login') // Explicitly redirect to /login
      return { ...action }
    }

    localStorage.setItem('user_role', role)

    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/tenant/tenantDashboard')
    }

    console.log('✅ Login Success:', user, 'Role:', role, 'Status:', status)
    action.formStatus = 200
    action.formSuccessMessage = `Welcome back!`
    return { ...action, user }
  } catch (error) {
    console.error('🛑 Login Failed:', error.message)
    toast.error(error.message || 'Login failed.')
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

    // Clear role to prevent conflicts
    localStorage.removeItem('user_role')

    return { success: true }
  } catch (error) {
    console.error('Logout Error:', error.message)
    return { success: false, message: error.message }
  }
}
