import { Upload , FileText  } from 'lucide-react'
import * as React from 'react'
import { usePage } from '@inertiajs/react'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import type { User } from '@/types'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { props: pageProps } = usePage<{ auth: { user: User } }>()
  const user = pageProps.auth.user

  const primeiroNome =
    typeof user.nome === 'string'
      ? user.nome.split(' ')[0]
      : user.name?.split(' ')[0] ?? 'Usuário'

  const matricula = user.matricula ?? "—"

  const data = {
    user: {
      name: `${primeiroNome} ${matricula}`,
      email: user.email ?? 'usuario@empresa.com',
      avatar: '',
    },
    teams: [
      {
        name: '409 - Baratão da Carne',
        logo: '/logo.ico',
        plan: 'Transferencia de Funcionario',
      },
    ],
    navMain: [
      {
        title: 'Transferir',
        url: '/home',
        icon: Upload,
        isActive: false,
      },
      {
        title: 'Logs',
        url: '/logs/transfunc',
        icon: FileText, // você pode usar outro ícone aqui, como "List" ou "FileText"
        isActive: false,
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
