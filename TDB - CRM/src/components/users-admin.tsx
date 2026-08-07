"use client";

import { useState } from "react";
import { createUser, updateUser, deleteUser, toggleUserActive } from "@/lib/actions";
import { Button, Input, Label, Select, Badge, Card } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/utils";
import type { Role } from "@/generated/prisma/client";

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
};

export function UsersAdmin({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="mb-4 text-sm font-semibold">
            {editing ? "Modifier l'utilisateur" : "Créer un utilisateur"}
          </h2>
          <form
            key={editing?.id ?? "create"}
            action={async (fd) => {
              if (editing) {
                await updateUser(fd);
                setMessage("Utilisateur mis à jour");
                setEditing(null);
              } else {
                await createUser(fd);
                setMessage("Utilisateur créé");
              }
            }}
            className="space-y-3"
          >
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div>
              <Label>Nom complet</Label>
              <Input name="fullName" required defaultValue={editing?.fullName ?? ""} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                required
                defaultValue={editing?.email ?? ""}
              />
            </div>
            <div>
              <Label>Rôle</Label>
              <Select name="role" defaultValue={editing?.role ?? "COMMERCIAL"}>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>
            {editing ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editing.active}
                />
                Compte actif
              </label>
            ) : null}
            <div>
              <Label>
                {editing ? "Nouveau mot de passe (optionnel)" : "Mot de passe temporaire"}
              </Label>
              <Input
                name="password"
                type="password"
                defaultValue={editing ? "" : "demo1234"}
                placeholder={editing ? "Laisser vide pour ne pas changer" : ""}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editing ? "Enregistrer" : "Créer"}</Button>
              {editing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(null)}
                >
                  Annuler
                </Button>
              ) : null}
            </div>
          </form>
          {message ? (
            <p className="mt-3 text-xs text-teal-800">{message}</p>
          ) : null}
        </div>
      </Card>

      <Card className="lg:col-span-3 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-stone-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.fullName}</p>
                  <p className="text-xs text-stone-500">{u.email}</p>
                </td>
                <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.active ? "success" : "danger"}>
                    {u.active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => {
                        setEditing(u);
                        setConfirmDelete(null);
                        setMessage("");
                      }}
                    >
                      Modifier
                    </Button>
                    <form
                      action={async () => {
                        await toggleUserActive(u.id, !u.active);
                      }}
                    >
                      <Button type="submit" variant="ghost" className="text-xs">
                        {u.active ? "Désactiver" : "Activer"}
                      </Button>
                    </form>
                    {u.id !== currentUserId ? (
                      confirmDelete === u.id ? (
                        <form
                          action={async () => {
                            await deleteUser(u.id);
                            setConfirmDelete(null);
                            setMessage("Utilisateur supprimé");
                          }}
                        >
                          <Button type="submit" variant="danger" className="text-xs">
                            Confirmer
                          </Button>
                        </form>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-xs text-red-700"
                          onClick={() => setConfirmDelete(u.id)}
                        >
                          Supprimer
                        </Button>
                      )
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
