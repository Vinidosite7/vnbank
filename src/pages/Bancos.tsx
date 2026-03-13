import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Landmark, Briefcase, User, Trash2, Edit2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Bank {
  id: string
  user_id: string
  name: string
  balance: number
  type: 'personal' | 'business'
  created_at: string
}

export default function BancosPage() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', balance: '', type: 'personal' as 'personal' | 'business' })

  useEffect(() => { fetchBanks() }, [])

  async function fetchBanks() {
    setLoading(true)
    const { data, error } = await supabase.from('bancos').select('*').order('created_at', { ascending: true })
    if (!error && data) setBanks(data)
    setLoading(false)
  }

  const resetForm = () => { setFormData({ name: '', balance: '', type: 'personal' }); setEditingId(null) }

  const handleSubmit = async () => {
    if (!formData.name) return
    setSaving(true)
    const payload = { name: formData.name, balance: parseFloat(formData.balance) || 0, type: formData.type }

    if (editingId) {
      const { data, error } = await supabase.from('bancos').update(payload).eq('id', editingId).select().single()
      if (!error && data) setBanks(prev => prev.map(b => b.id === editingId ? data : b))
    } else {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('bancos').insert([{ ...payload, user_id: userData.user?.id }]).select().single()
      if (!error && data) setBanks(prev => [...prev, data])
    }
    setSaving(false); resetForm(); setIsDialogOpen(false)
  }

  const handleEdit = (bank: Bank) => {
    setFormData({ name: bank.name, balance: bank.balance.toString(), type: bank.type })
    setEditingId(bank.id); setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este banco?')) return
    const { error } = await supabase.from('bancos').delete().eq('id', id)
    if (!error) setBanks(prev => prev.filter(b => b.id !== id))
  }

  const totalBalance = banks.reduce((s, b) => s + b.balance, 0)

  return (
    <PageWrapper title="Bancos">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total em Bancos</p>
              <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Landmark className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => { resetForm(); setIsDialogOpen(true) }} className="w-full mb-6">
        <Plus className="w-4 h-4 mr-2" /> Adicionar Banco
      </Button>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : banks.length === 0 ? (
        <Card><CardContent className="p-8 text-center">
          <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum banco cadastrado</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {banks.map(bank => (
            <Card key={bank.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {bank.type === 'business' ? <Briefcase className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-medium">{bank.name}</h3>
                      <Badge variant="secondary" className="text-xs">{bank.type === 'business' ? 'PJ' : 'Pessoal'}</Badge>
                    </div>
                  </div>
                  <p className={`font-bold ${bank.balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>{formatCurrency(bank.balance)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(bank)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(bank.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={open => { if (!open) resetForm(); setIsDialogOpen(open) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Editar Banco' : 'Adicionar Banco'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Banco</Label>
              <Input placeholder="Ex: Nubank, Itaú..." value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Saldo Atual</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={formData.balance} onChange={e => setFormData(p => ({ ...p, balance: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v as 'personal' | 'business' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="business">PJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false) }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
