/**
 * Profile.jsx  (/profile)
 *
 * Simple profile form. Doesn't save to backend yet, just local state.
 */

import { useState } from 'react'

export default function Profile() {
  const [formData, setFormData] = useState({
    name: 'User',
    role: '',
    company: ''
  })
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (saved) setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulate save
    setTimeout(() => setSaved(true), 300)
  }

  return (
    <div className="bg-card border-t border-row-line px-8 py-10 rounded-lg">
      
      {/* Headline */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-ink leading-tight tracking-wide">
          Your Profile
        </h1>
        <p className="font-app text-sm text-ink-soft mt-2">
          Manage your account details and preferences.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        
        {/* Name */}
        <div>
          <label htmlFor="profile-name" className="block font-app text-sm font-bold text-ink mb-1.5">
            Full Name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full font-app text-sm text-ink placeholder-ink-soft/70 border border-ink/15 rounded-lg px-4 py-2.5 focus:outline-none focus:border-ink/40 transition-colors bg-transparent"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="profile-role" className="block font-app text-sm font-bold text-ink mb-1.5">
            Primary Role
          </label>
          <input
            id="profile-role"
            name="role"
            type="text"
            placeholder="e.g. Independent Producer"
            value={formData.role}
            onChange={handleChange}
            className="w-full font-app text-sm text-ink placeholder-ink-soft/70 border border-ink/15 rounded-lg px-4 py-2.5 focus:outline-none focus:border-ink/40 transition-colors bg-transparent"
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="profile-company" className="block font-app text-sm font-bold text-ink mb-1.5">
            Company / Organization
          </label>
          <input
            id="profile-company"
            name="company"
            type="text"
            placeholder="e.g. Studio Fulcrum"
            value={formData.company}
            onChange={handleChange}
            className="w-full font-app text-sm text-ink placeholder-ink-soft/70 border border-ink/15 rounded-lg px-4 py-2.5 focus:outline-none focus:border-ink/40 transition-colors bg-transparent"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center gap-4">
          <button
            type="submit"
            className="font-app font-bold text-sm px-6 py-2.5 rounded-lg transition-all duration-150 bg-ink text-card hover:bg-ink/85 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink"
          >
            Save Changes
          </button>

          {saved && (
            <span className="font-app text-sm text-verified font-medium animate-fade-in">
              Saved successfully.
            </span>
          )}
        </div>
      </form>

    </div>
  )
}
