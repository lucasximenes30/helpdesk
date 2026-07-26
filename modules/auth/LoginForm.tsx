"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LoginForm() {
  const [email, setEmail] = useState("admin@cgconstrucoes.com.br");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { config } = useWhiteLabel();
  const { refresh } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erro ao realizar login.");
        setLoading(false);
        return;
      }

      await refresh();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Erro de comunicação com o servidor.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-secondary/40 to-primary/5 p-4">
      <Card className="w-full max-w-md overflow-hidden border-border/80 bg-card/90 shadow-2xl backdrop-blur-md">
        <CardHeader className="flex flex-col items-center text-center space-y-3 pt-8 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 p-2 shadow-inner">
            <Image
              src={config.logo}
              alt={config.systemName}
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {config.systemName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Faça login no sistema de atendimento técnico
            </p>
          </div>
          <Badge
            variant="outline"
            className="mt-2 bg-primary/10 text-primary border-primary/20 px-3 py-0.5 text-xs font-semibold"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            CG Construções • White Label Pro
          </Badge>
        </CardHeader>

        <CardContent className="px-8 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                E-mail Profissional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@cgconstrucoes.com.br"
                  required
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                >
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold text-base shadow-md transition-all mt-2"
            >
              {loading ? (
                "Autenticando no Neon..."
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center bg-muted/40 px-8 py-4 text-center border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Primeiro Administrador (.env configurado):
          </p>
          <p className="text-xs font-mono text-foreground mt-0.5">
            admin@cgconstrucoes.com.br / admin123
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
