"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui";

const COLORS = ["#0f766e", "#c4a574", "#1e3a5f", "#b45309", "#57534e", "#0e7490"];

export function StatsCharts({
  byStatus,
  byProduct,
  byCommercial = [],
  byApporteur = [],
}: {
  byStatus: { name: string; value: number }[];
  byProduct: { name: string; value: number }[];
  byCommercial?: { name: string; closes: number; ca: number }[];
  byApporteur?: { name: string; leads: number; closes: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-sm font-semibold">Leads par statut</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold">Répartition produits</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byProduct} dataKey="value" nameKey="name" outerRadius={90} label>
                {byProduct.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {byCommercial.length > 0 ? (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">
            Performance commerciaux (closes)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCommercial}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="closes" fill="#1e3a5f" name="Closes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}

      {byApporteur.length > 0 ? (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">
            Apporteurs (leads / converts)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byApporteur}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="#c4a574" name="Leads" />
                <Bar dataKey="closes" fill="#0f766e" name="Convertis" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
