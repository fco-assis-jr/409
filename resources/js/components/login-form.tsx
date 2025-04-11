"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "@inertiajs/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { data, setData, post, processing, errors } = useForm({
    usuario: "",
    senha: "",
  })

  const [lastError, setLastError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post("/login", {
      onError: () => {
        setLastError(errors.usuario + "-" + Date.now())
      }
    })
  }

  useEffect(() => {
    if (errors.usuario && lastError) {
      toast.error("Erro ao fazer login", {
        description: errors.usuario,
        id: `login-${Date.now()}`
      })
    }
  }, [lastError, errors.usuario]) // <-- dependência adicionada

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 w-full">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Bem-vindo</h1>
                <p className="text-muted-foreground text-balance">
                  Faça login no sistema com suas credenciais Winthor
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="Ex: TESTE123"
                  value={data.usuario}
                  onChange={(e) => setData("usuario", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={data.senha}
                  onChange={(e) => setData("senha", e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Imagem"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
