'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslations } from '@/lib/i18n'
import { deleteClient } from '@/lib/actions/clients'
import { ClientFormDialog } from './client-form-dialog'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
  tags: string[]
  note: string | null
}

interface ClientsTableProps {
  clients: Client[]
}

const statusColors: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

  const handleDelete = () => {
    if (!deletingClient) return

    startTransition(async () => {
      const result = await deleteClient(deletingClient.id)

      if (result.success) {
        toast.success(t.common.success)
        setDeletingClient(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">{t.clients.name}</TableHead>
              <TableHead className="font-semibold">{t.clients.email}</TableHead>
              <TableHead className="font-semibold">{t.clients.phone}</TableHead>
              <TableHead className="font-semibold">{t.clients.status}</TableHead>
              <TableHead className="font-semibold">{t.clients.tags}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/app/clients/${client.id}`)}
              >
                <TableCell className="font-medium text-gray-900">
                  {client.name}
                </TableCell>
                <TableCell className="text-gray-600">
                  {client.email || '—'}
                </TableCell>
                <TableCell className="text-gray-600">
                  {client.phone || '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusColors[client.status]}
                  >
                    {t.clients.statuses[client.status as keyof typeof t.clients.statuses]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {client.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {client.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{client.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t.common.actions}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/app/clients/${client.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t.clients.clientDetails}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingClient(client)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingClient(client)
                        }}
                        className="text-red-600 focus:bg-red-50 focus:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingClient && (
        <ClientFormDialog
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          client={editingClient}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingClient} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.clients.deleteClient}</DialogTitle>
            <DialogDescription>
              {t.clients.deleteConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingClient(null)}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
