"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { mockConversations, mockMessages } from "@/lib/mock-data"
import { 
  MessageSquare, 
  Send, 
  Search,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  ImageIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    mockConversations[0]?.id || null
  )
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileChat, setShowMobileChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedConvo = mockConversations.find(c => c.id === selectedConversation)
  const messages = selectedConversation ? mockMessages[selectedConversation] || [] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    // In a real app, this would send the message to the backend
    setMessageInput("")
  }

  const filteredConversations = mockConversations.filter(
    c => c.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <MessageSquare className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sign in to view messages</h1>
            <p className="text-muted-foreground mb-6">
              Chat with buyers and sellers
            </p>
            <Button onClick={() => setShowAuthModal(true)} size="lg" className="rounded-full">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="h-[calc(100vh-200px)] flex gap-4">
          {/* Conversations List */}
          <Card className={cn(
            "rounded-2xl w-full md:w-96 flex-shrink-0 overflow-hidden",
            showMobileChat && "hidden md:flex"
          )}>
            <CardContent className="p-0 h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-full bg-muted border-0"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation.id)
                        setShowMobileChat(true)
                      }}
                      className={cn(
                        "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b",
                        selectedConversation === conversation.id && "bg-muted"
                      )}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.participant.avatar} />
                        <AvatarFallback>
                          {conversation.participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate">
                            {conversation.participant.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conversation.lastMessageAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.product && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="relative w-8 h-8 rounded overflow-hidden">
                              <Image
                                src={conversation.product.image}
                                alt={conversation.product.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {conversation.product.title}
                            </span>
                          </div>
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className={cn(
            "rounded-2xl flex-1 overflow-hidden",
            !showMobileChat && "hidden md:flex"
          )}>
            {selectedConvo ? (
              <CardContent className="p-0 h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setShowMobileChat(false)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConvo.participant.avatar} />
                      <AvatarFallback>
                        {selectedConvo.participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedConvo.participant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedConvo.participant.isOnline ? (
                          <span className="text-green-600">Online</span>
                        ) : (
                          "Last seen recently"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Product Context */}
                {selectedConvo.product && (
                  <div className="p-3 bg-muted/50 border-b">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={selectedConvo.product.image}
                          alt={selectedConvo.product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedConvo.product.title}</p>
                        <p className="text-primary font-semibold">
                          ${selectedConvo.product.price}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.senderId === "current-user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            message.senderId === "current-user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            message.senderId === "current-user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 rounded-full bg-muted border-0"
                    />
                    <Button 
                      size="icon" 
                      className="rounded-full"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a conversation to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
