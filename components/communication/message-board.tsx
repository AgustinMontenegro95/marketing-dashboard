"use client"

import { useState } from "react"
import type { Message } from "./communication-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MessageBoard({
  messages,
  onSendMessage,
}: {
  messages: Message[]
  onSendMessage: (content: string, channel: string) => void
}) {
  const [input, setInput] = useState("")
  const [activeChannel, setActiveChannel] = useState("general")

  const channels = ["general", "marketing", "diseño", "desarrollo"]
  const filteredMessages = messages.filter((m) => m.channel === activeChannel)

  function handleSend() {
    if (!input.trim()) return
    onSendMessage(input.trim(), activeChannel)
    setInput("")
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Canales</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs value={activeChannel} onValueChange={setActiveChannel}>
          <TabsList>
            {channels.map((ch) => (
              <TabsTrigger key={ch} value={ch} className="capitalize text-xs">
                #{ch}
              </TabsTrigger>
            ))}
          </TabsList>
          {channels.map((ch) => (
            <TabsContent key={ch} value={ch} className="mt-4">
              <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
                {filteredMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay mensajes en este canal todavía.
                  </p>
                ) : (
                  filteredMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3">
                      <Avatar className="size-8 mt-0.5 shrink-0">
                        <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                          {msg.author.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{msg.author.name}</span>
                          <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Input
            placeholder={`Escribir en #${activeChannel}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
            }}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
            <Send className="size-4" />
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
