"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Tipos definidos para evitar 'any'
type Funcionario = {
  nome: string
  matricula: string
  perfil: string
  codfilial: string
  codusur: string
  usuariobd: string
}

type Perfil = {
  codigo: string
  nome: string
}

type Filial = {
  codfilial: string
  local: string
}

export default function Page() {
  const [nomeBusca, setNomeBusca] = useState("")
  const [resultados, setResultados] = useState<Funcionario[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const [novaFilial, setNovaFilial] = useState<string>("")
  const [novoPerfil, setNovoPerfil] = useState<string>("")
  const [perfisDisponiveis, setPerfisDisponiveis] = useState<Perfil[]>([])
  const [filiaisDisponiveis, setFiliaisDisponiveis] = useState<Filial[]>([])
  const [foiSelecionado, setFoiSelecionado] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    axios.get("/api/filiais").then((res) => setFiliaisDisponiveis(res.data))
    axios.get("/api/perfis").then((res) => setPerfisDisponiveis(res.data))
  }, [])

  useEffect(() => {
    if (nomeBusca.length < 3) return setResultados([])

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      axios
        .get("/api/funcionarios", { params: { nome: nomeBusca } })
        .then((res) => {
          setResultados(res.data)

          const matchExato = res.data.some(
            (f: Funcionario) => f.nome.toUpperCase() === nomeBusca.toUpperCase()
          )
          setMostrarSugestoes(!matchExato && !foiSelecionado)
        })
    }, 300)
  }, [nomeBusca, foiSelecionado]) // <- dependência adicionada

  const selecionarFuncionario = (func: Funcionario) => {
    setNomeBusca(func.nome)
    setFuncionarioSelecionado(func)
    setMostrarSugestoes(false)
    setFoiSelecionado(true)
  }

  const handleTransferir = () => {
    if (!funcionarioSelecionado || !novoPerfil || !novaFilial) {
      toast.error("Preencha todos os campos antes de transferir.", { duration: 8000 })
      return
    }

    axios.post("/api/transfunc", {
      perfil_codigo: novoPerfil,
      matricula_destino: funcionarioSelecionado.matricula,
      filial_destino: novaFilial,
    }).then(res => {
      const mensagem = res.data.mensagem || ""

      const perfilEncontrado = perfisDisponiveis.find(p => p.codigo === novoPerfil)

      setFuncionarioSelecionado({
        ...funcionarioSelecionado,
        codfilial: novaFilial,
        perfil: perfilEncontrado ? perfilEncontrado.nome : novoPerfil,
      })

      if (mensagem.includes("RCA")) {
        toast.warning("Transferido com alerta!", {
          description: mensagem,
          duration: 8000,
        })
      } else {
        toast.success("Transferido com sucesso!", {
          description: mensagem,
          duration: 8000,
        })
      }
    }).catch(err => {
      toast.error("Erro ao Transferir funcionário", {
        description: err.response?.data?.mensagem || "Erro inesperado.",
        duration: 8000,
      })
    })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="home">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Transferir</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-muted/50 rounded-xl p-6 max-w-2xl w-full mx-auto mt-10 space-y-6">
            <h2 className="text-xl font-semibold">Transferência de Funcionário</h2>

            {/* Nome do funcionário */}
            <div className="grid gap-2 relative">
              <Label htmlFor="nome">Nome do Funcionário</Label>
              <Input
                id="nome"
                placeholder="Digite nome ou matrícula"
                value={nomeBusca}
                onChange={(e) => {
                  setNomeBusca(e.target.value)
                  setFoiSelecionado(false)
                }}
                onFocus={() => {
                  if (nomeBusca.length >= 3 && !foiSelecionado) {
                    setMostrarSugestoes(true)
                  }
                }}
                onBlur={() => setTimeout(() => setMostrarSugestoes(false), 300)}
                autoComplete="off"
              />
              {mostrarSugestoes && resultados.length > 0 && (
                <ul className="absolute top-full left-0 z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background text-sm shadow-md">
                  {resultados.map((f) => (
                    <li
                      key={f.matricula}
                      className="cursor-pointer px-3 py-1 hover:bg-muted"
                      onMouseDown={() => selecionarFuncionario(f)}
                    >
                      <strong>{f.nome}</strong>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {f.matricula} • {f.perfil} • Filial {f.codfilial}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Informações atuais */}
            {funcionarioSelecionado && (
              <>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Matrícula</Label>
                    <Input value={funcionarioSelecionado.matricula} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label>Filial Atual</Label>
                    <Input value={`Filial ${funcionarioSelecionado.codfilial}`} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label>RCA</Label>
                    <Input value={funcionarioSelecionado.codusur} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label>Perfil Atual</Label>
                    <Input value={funcionarioSelecionado.perfil} disabled />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label>Login</Label>
                    <Input value={funcionarioSelecionado.usuariobd} disabled />
                  </div>
                </div>
                <Separator className="my-4" />
                <h3 className="text-lg font-medium">Novo Destino</h3>
              </>
            )}

            {/* Novo Perfil */}
            <div className="grid gap-2">
              <Label htmlFor="novoPerfil">Novo Perfil</Label>
              <Select defaultValue={novoPerfil} onValueChange={setNovoPerfil}>
                <SelectTrigger id="novoPerfil">
                  <SelectValue placeholder="Selecione um novo perfil" />
                </SelectTrigger>
                <SelectContent>
                  {perfisDisponiveis.map((perfil) => (
                    <SelectItem key={perfil.codigo} value={perfil.codigo}>
                      {perfil.nome}
                      <span className="ml-2 text-xs text-muted-foreground">
                        Cod: {perfil.codigo}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nova Filial */}
            <div className="grid gap-2">
              <Label htmlFor="novaFilial">Nova Filial</Label>
              <Select defaultValue={novaFilial} onValueChange={setNovaFilial}>
                <SelectTrigger id="novaFilial">
                  <SelectValue placeholder="Selecione a nova filial" />
                </SelectTrigger>
                <SelectContent>
                  {filiaisDisponiveis.map((filial) => (
                    <SelectItem key={filial.codfilial} value={filial.codfilial}>
                      {filial.codfilial} - {filial.local}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-4" onClick={handleTransferir}>
              Transferir
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
