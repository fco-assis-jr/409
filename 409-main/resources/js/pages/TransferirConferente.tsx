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

type Funcionario = {
  nome: string
  matricula: string
  codfilial: string
  codusur: string
  usuariobd: string
}

type Filial = {
  codfilial: string
  local: string
}

export default function TransferirConferente() {
  const [nomeBusca, setNomeBusca] = useState("")
  const [resultados, setResultados] = useState<Funcionario[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const [novaFilial, setNovaFilial] = useState<string>("")
  const [filiaisDisponiveis, setFiliaisDisponiveis] = useState<Filial[]>([])
  const [foiSelecionado, setFoiSelecionado] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    axios.get("/api/filiais").then((res) => setFiliaisDisponiveis(res.data))
  }, [])

  useEffect(() => {
    if (nomeBusca.length < 3) {
      setResultados([])
      setMostrarSugestoes(false)
      return
    }

    if (foiSelecionado) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      axios
        .get("/api/conferentes", { params: { nome: nomeBusca } }) // <-- Tem de ser '/api/conferentes'
        .then((res) => {
          const dados = Array.isArray(res.data) ? res.data : []
          setResultados(dados)
          setMostrarSugestoes(dados.length > 0)
        })
        .catch(() => {
          setResultados([])
          setMostrarSugestoes(false)
        })
    }, 300)
  }, [nomeBusca, foiSelecionado])

  const selecionarFuncionario = (func: Funcionario) => {
    setNomeBusca(func.nome)
    setFuncionarioSelecionado(func)
    setMostrarSugestoes(false)
    setFoiSelecionado(true)
  }

  const handleTransferir = () => {
    if (!funcionarioSelecionado || !novaFilial) {
      toast.error("Preencha todos os campos obrigatórios antes de transferir.", { duration: 8000 })
      return
    }

    axios
      .post("/api/transferir-conferente", {
        matricula_destino: funcionarioSelecionado.matricula,
        filial_destino: novaFilial,
      })
      .then((res) => {
        const mensagem = res.data?.mensagem || ""

        setFuncionarioSelecionado({
          ...funcionarioSelecionado,
          codfilial: novaFilial,
        })

        toast.success("Transferência de conferente realizada com sucesso!", {
          description: mensagem,
          duration: 8000,
        })
      })
      .catch((err) => {
        toast.error("Erro ao transferir conferente", {
          description: err.response?.data?.mensagem || "Erro inesperado no servidor.",
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
                  <BreadcrumbPage>Transferir Conferente</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-muted/50 rounded-xl p-6 max-w-2xl w-full mx-auto mt-10 space-y-6">
            <h2 className="text-xl font-semibold">Transferência de Conferente</h2>

            {/* Nome do funcionário */}
            <div className="grid gap-2 relative">
              <Label htmlFor="nome">Nome do Conferente</Label>
              <Input
                id="nome"
                placeholder="Digite nome ou matrícula"
                value={nomeBusca}
                onChange={(e) => {
                  setNomeBusca(e.target.value)
                  setFoiSelecionado(false)
                }}
                onFocus={() => {
                  if (resultados.length > 0 && !foiSelecionado) {
                    setMostrarSugestoes(true)
                  }
                }}
                onBlur={() => setTimeout(() => setMostrarSugestoes(false), 300)}
                autoComplete="off"
              />
              {mostrarSugestoes && resultados.length > 0 && (
                <ul className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground text-sm shadow-md">
                  {resultados.map((f) => (
                    <li
                      key={f.matricula}
                      className="cursor-pointer px-3 py-2 hover:bg-muted"
                      onMouseDown={() => selecionarFuncionario(f)}
                    >
                      <strong>{f.nome}</strong>
                      <span className="ml-2 text-xs text-muted-foreground">
                        Mat: {f.matricula} | Filial {f.codfilial}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Informações atuais do funcionário */}
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
                    <Input value={funcionarioSelecionado.codusur || "N/A"} disabled />
                  </div>
                  <div className="grid gap-2 md:col-span-3">
                    <Label>Login</Label>
                    <Input value={funcionarioSelecionado.usuariobd} disabled />
                  </div>
                </div>
                <Separator className="my-4" />
                <h3 className="text-lg font-medium">Novo Destino</h3>
              </>
            )}

            {/* Nova Filial */}
            <div className="grid gap-2">
              <Label htmlFor="novaFilial">Nova Filial</Label>
              <Select value={novaFilial} onValueChange={setNovaFilial}>
                <SelectTrigger id="novaFilial">
                  <SelectValue placeholder="Selecione a nova filial" />
                </SelectTrigger>
                <SelectContent>
                  {filiaisDisponiveis.map((filial) => (
                    <SelectItem key={String(filial.codfilial)} value={String(filial.codfilial)}>
                      {filial.codfilial} - {filial.local}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-4" onClick={handleTransferir}>
              Transferir Conferente
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}