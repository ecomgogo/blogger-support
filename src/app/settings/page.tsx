"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Author" | "Editor" | "Reviewer">("Author");

  const { data: memberData } = trpc.team.listMembers.useQuery();
  const { data: inviteData } = trpc.team.getInvitations.useQuery();
  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      utils.team.getInvitations.invalidate();
      setEmail("");
    },
  });
  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => utils.team.listMembers.invalidate(),
  });

  const members = memberData?.members ?? [];
  const invitations = inviteData?.invitations ?? [];

  return (
    <main className="flex flex-1 flex-col p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Team Settings</h1>

      {/* Invite form */}
      <div className="rounded-lg border p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">Invite Member</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 h-9 rounded border bg-background px-3 text-sm"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                inviteMutation.mutate({ email, role });
            }}
          />
          <select
            className="h-9 rounded border bg-background px-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="Author">Author</option>
            <option value="Editor">Editor</option>
            <option value="Reviewer">Reviewer</option>
          </select>
          <Button
            size="sm"
            onClick={() => inviteMutation.mutate({ email, role })}
            disabled={!email || inviteMutation.isPending}
          >
            <UserPlus className="mr-1 h-4 w-4" />
            Invite
          </Button>
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="rounded-lg border p-4 mb-6 space-y-2">
          <h2 className="font-semibold text-sm">Pending Invitations</h2>
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between text-sm">
              <span>{inv.email}</span>
              <span className="text-xs text-muted-foreground capitalize">{inv.role}</span>
            </div>
          ))}
        </div>
      )}

      {/* Members list */}
      <div className="rounded-lg border p-4 space-y-2">
        <h2 className="font-semibold text-sm">
          Members ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2">
                <span>{m.userId.slice(0, 12)}...</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full capitalize">
                  {m.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeMember.mutate({ memberId: m.id })}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
