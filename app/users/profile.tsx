import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/api'

export default function UserProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    photoURL: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      if (!user) return
      const response = await authFetch('/api/me', {}, user)
      const data = await response.json()
      if (data.success) {
        setProfile(data.data)
        setForm(f => ({
          ...f,
          name: data.data.name || '',
          phone: data.data.phone || '',
          photoURL: data.data.photoURL || ''
        }))
        setPreview(data.data.photoURL || '')
      } else {
        toast.error(data.error || 'Erro ao carregar perfil')
      }
    } catch (e) {
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleImageChange = (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev: any) => {
      setPreview(ev.target.result)
      setForm(f => ({ ...f, photoURL: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        name: form.name,
        phone: form.phone,
        photoURL: form.photoURL
      }
      if (form.currentPassword && form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }
      const response = await authFetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, user)
      const data = await response.json()
      if (data.success) {
        toast.success('Perfil atualizado com sucesso!')
        setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
        fetchProfile()
      } else {
        toast.error(data.error || 'Erro ao atualizar perfil')
      }
    } catch (e) {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AppLayout><div className="p-8">Carregando perfil...</div></AppLayout>
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Meu Perfil</h2>
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 mb-2">
            <AvatarImage src={preview} />
            <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <Input name="name" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <Input name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Trocar Senha</h3>
          <div className="space-y-3">
            <Input name="currentPassword" type="password" placeholder="Senha atual" value={form.currentPassword} onChange={handleChange} />
            <Input name="newPassword" type="password" placeholder="Nova senha" value={form.newPassword} onChange={handleChange} />
            <Input name="confirmPassword" type="password" placeholder="Confirmar nova senha" value={form.confirmPassword} onChange={handleChange} />
          </div>
        </div>
        <Button className="mt-8 w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </AppLayout>
  )
} 